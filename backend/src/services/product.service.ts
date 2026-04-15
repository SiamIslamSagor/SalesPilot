import { Request } from "express";
import * as XLSX from "xlsx";
import ProductRepository from "../repositories/product.repository";
import Offer from "../models/offer.model";
import {
  ProductImportData,
  ProductImportResult,
  ProductVariant,
} from "../types/product.types";
import {
  cleanString,
  createVariantKey,
  detectExcelFormat,
  getColumnMapping,
  getValue,
  normalizeSize,
  parseImages,
  parsePrice,
} from "../utils/excelHelpers";
import { uploadToCloudinary } from "../utils/cloudinary";
import logger from "../utils/logger";

class ProductService {
  private productRepository = ProductRepository;

  /**
   * Parse Excel file and extract product data
   * Supports both Finnish and English Excel formats with automatic detection
   */
  async parseExcelFile(req: Request): Promise<ProductImportData[]> {
    if (!req.file) {
      throw new Error("No file uploaded");
    }

    const buffer = req.file.buffer;
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    if (jsonData.length === 0) {
      throw new Error("Excel file is empty");
    }

    // Detect Excel format from the first row
    const firstRow = jsonData[0] as Record<string, unknown>;
    const format = detectExcelFormat(firstRow);

    logger.debug(`Detected Excel format: ${format.toUpperCase()}`);

    if (format === "unknown") {
      throw new Error(
        "Unable to detect Excel format. Please ensure the file uses either Finnish or English column names.",
      );
    }

    // Get the appropriate column mapping for the detected format
    const columnMapping = getColumnMapping(format);

    // Validate that all required columns exist
    const requiredColumns = [
      ...columnMapping.productNumber,
      ...columnMapping.name,
      ...columnMapping.size,
    ];

    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));
    if (missingColumns.length > 0) {
      throw new Error(
        `Missing required columns in Excel file: ${missingColumns.join(", ")}`,
      );
    }

    logger.debug(`Validation passed - ${jsonData.length} rows to parse`);

    // Map Excel data to ProductImportData format using helper functions
    const rawProducts: ProductImportData[] = jsonData.map((row, index) => {
      // Extract values using the getValue helper with column mapping
      const productNumber = cleanString(
        getValue(row, columnMapping.productNumber) || "",
      );
      const name = cleanString(getValue(row, columnMapping.name) || "");
      const description = cleanString(
        getValue(row, columnMapping.description) || "",
      );
      const category = cleanString(getValue(row, columnMapping.category) || "");
      const brand = cleanString(getValue(row, columnMapping.brand) || "");
      const gender = cleanString(getValue(row, columnMapping.gender) || "");
      const fabrics = cleanString(getValue(row, columnMapping.fabrics) || "");
      const countryOfOrigin = cleanString(
        getValue(row, columnMapping.countryOfOrigin) || "",
      );

      // Validate required fields
      if (!productNumber) {
        throw new Error(`Row ${index + 2}: Product number cannot be empty`);
      }
      if (!name) {
        throw new Error(`Row ${index + 2}: Product name cannot be empty`);
      }

      // Parse prices using the parsePrice helper
      const purchasePrice = parsePrice(
        getValue(row, columnMapping.purchasePrice),
      );
      const salesPrice = parsePrice(getValue(row, columnMapping.salesPrice));

      // Parse images using the parseImages helper
      const images = parseImages(getValue(row, columnMapping.images));

      // Extract variant data
      const color = getValue(row, columnMapping.color);
      const colorCode = cleanString(
        getValue(row, columnMapping.colorCode) || "",
      );
      const sizeNameRaw = getValue(row, columnMapping.size);
      const sizeName = sizeNameRaw ? normalizeSize(sizeNameRaw) : undefined;

      // Check for variant-specific price, fall back to product sales price
      const variantPriceRaw = getValue(row, ["Price", "Variant price"]);
      const variantPrice = variantPriceRaw
        ? parsePrice(variantPriceRaw)
        : salesPrice;

      return {
        productNumber,
        name,
        description,
        category,
        brand,
        gender,
        fabrics,
        purchasePrice,
        salesPrice,
        images,
        color,
        colorCode,
        sizeName,
        variantPrice,
        countryOfOrigin,
      };
    });

    // Group products by productNumber to handle variants
    const productMap = new Map<
      string,
      ProductImportData & { variants: ProductVariant[] }
    >();

    rawProducts.forEach((product) => {
      const key = product.productNumber;

      if (!productMap.has(key)) {
        // First time seeing this product number
        productMap.set(key, {
          ...product,
          variants: product.sizeName
            ? [
                {
                  size: product.sizeName,
                  color: product.color,
                  colorCode: product.colorCode || "",
                  price: product.variantPrice || product.salesPrice,
                },
              ]
            : [],
        });
      } else {
        // Product already exists, add variant if sizeName/color combination is different
        const existingProduct = productMap.get(key)!;
        if (product.sizeName) {
          // Validate that colorCode is provided for variants
          if (!product.colorCode) {
            throw new Error(
              `Product ${product.productNumber}: Color code is required for variants`,
            );
          }
          const variantKey = createVariantKey(product.sizeName, product.color);
          const existingVariant = existingProduct.variants.find(
            (v) => createVariantKey(v.size, v.color) === variantKey,
          );
          if (!existingVariant) {
            existingProduct.variants.push({
              size: product.sizeName,
              color: product.color,
              colorCode: product.colorCode || "",
              price: product.variantPrice || product.salesPrice,
            });
          }
        }
      }
    });

    // Convert map back to array
    const products: ProductImportData[] = Array.from(productMap.values()).map(
      (p) => ({
        productNumber: p.productNumber,
        name: p.name,
        description: p.description,
        category: p.category,
        brand: p.brand,
        gender: p.gender,
        fabrics: p.fabrics,
        purchasePrice: p.purchasePrice,
        salesPrice: p.salesPrice,
        images: p.images,
        variants: p.variants,
        countryOfOrigin: p.countryOfOrigin,
      }),
    );

    logger.debug(
      `Parsed ${products.length} unique products with ${products.reduce((sum, p) => sum + (p.variants?.length || 0), 0)} total variants`,
    );

    return products;
  }

  /**
   * Import products from parsed Excel data
   */
  async importProducts(
    products: ProductImportData[],
  ): Promise<ProductImportResult> {
    // Log the first 10 products that would be imported
    logger.debug("First 10 products to import:");
    logger.debug(JSON.stringify(products.slice(0, 10), null, 2));

    // Log unique counts
    const uniqueProductNumbers = new Set(products.map((p) => p.productNumber));
    const uniqueNames = new Set(products.map((p) => p.name));
    const uniqueCategories = new Set(products.map((p) => p.category));
    const uniqueGenders = new Set(products.map((p) => p.gender));

    logger.debug(`Unique Product Numbers: ${uniqueProductNumbers.size}`);
    logger.debug(`Unique Names: ${uniqueNames.size}`);
    logger.debug(`Unique Categories: ${uniqueCategories.size}`);
    logger.debug(`Unique Genders: ${uniqueGenders.size}`);

    // Convert ProductImportData to Product format with required fields
    const productsToStore = products.map((p) => {
      // Calculate margin manually since bulk update operations don't trigger schema hooks
      const margin =
        p.salesPrice > 0
          ? ((p.salesPrice - p.purchasePrice) / p.salesPrice) * 100
          : 0;

      return {
        productNumber: p.productNumber,
        name: p.name,
        description: p.description,
        category: p.category,
        brand: p.brand,
        gender: p.gender,
        fabrics: p.fabrics,
        purchasePrice: p.purchasePrice,
        salesPrice: p.salesPrice,
        margin,
        status: "active" as const,
        images: p.images,
        variants: p.variants || [],
        countryOfOrigin: p.countryOfOrigin,
      };
    });

    // Store products in MongoDB using bulkUpsert
    const importResults =
      await this.productRepository.bulkUpsert(productsToStore);

    return {
      success: true,
      message: `Successfully imported ${importResults.created} new products and updated ${importResults.updated} existing products`,
      importedCount: importResults.created,
      failedCount: 0,
    };
  }

  /**
   * Get all products with filtering, pagination, and search
   */
  async getAllProducts(options?: {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    gender?: string;
    search?: string;
    ids?: string[];
    productNumbers?: string[];
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    // Apply filters if provided
    if (options?.category) {
      filter.category = options.category;
    }
    if (options?.brand) {
      filter.brand = options.brand;
    }
    if (options?.gender) {
      filter.gender = options.gender;
    }
    if (options?.ids && options.ids.length > 0) {
      filter._id = { $in: options.ids };
    }
    if (options?.productNumbers && options.productNumbers.length > 0) {
      filter.productNumber = { $in: options.productNumbers };
    }
    if (options?.search) {
      const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { productNumber: { $regex: escaped, $options: "i" } },
      ];
    }

    // Calculate pagination with safe defaults
    const page = options?.page || 1;
    const MAX_LIMIT = 500;
    const limit = options?.limit ? Math.min(options.limit, MAX_LIMIT) : 50;
    const skip = (page - 1) * limit;

    const { products, total } = await this.productRepository.findAllPaginated(
      filter,
      { skip, limit },
    );

    logger.debug(`Products count: ${products.length}, Total count: ${total}`);

    return {
      products,
      pagination: {
        total,
        page,
        pages: limit ? Math.ceil(total / limit) : 1,
        limit: limit || total,
      },
    };
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string) {
    return this.productRepository.findById(id);
  }

  /**
   * Upload any base64 images in the array to Cloudinary, keeping existing URLs as-is.
   */
  private async uploadImages(images: string[]): Promise<string[]> {
    return Promise.all(
      images.map(async (img) => {
        if (img.startsWith("data:")) {
          const url = await uploadToCloudinary(img);
          return url || img;
        }
        return img;
      }),
    );
  }

  /**
   * Create a new product
   */
  async createProduct(
    productData: Omit<ProductImportData, "variants"> & {
      variants?: ProductVariant[];
    },
  ) {
    const margin =
      productData.salesPrice > 0
        ? ((productData.salesPrice - productData.purchasePrice) /
            productData.salesPrice) *
          100
        : 0;

    const fullProductData = {
      ...productData,
      images: productData.images
        ? await this.uploadImages(productData.images)
        : [],
      margin,
      status: "active" as const,
      variants: productData.variants || [],
    };

    return this.productRepository.create(fullProductData);
  }

  /**
   * Update a product
   */
  async updateProduct(id: string, productData: Partial<ProductImportData>) {
    if (productData.images) {
      productData.images = await this.uploadImages(productData.images);
    }
    return this.productRepository.update(id, productData);
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string) {
    // Check if product is used in any non-completed offers
    const activeOfferCount = await Offer.countDocuments({
      "items.productId": id,
      status: { $in: ["draft", "sent"] },
    });
    if (activeOfferCount > 0) {
      throw new Error(
        `Cannot delete product — it is used in ${activeOfferCount} active offer(s).`,
      );
    }
    return this.productRepository.delete(id);
  }

  /**
   * Get distinct categories from products
   */
  async getDistinctCategories(): Promise<string[]> {
    return this.productRepository.getDistinctCategories();
  }

  /**
   * Get distinct brands from products
   */
  async getDistinctBrands(): Promise<string[]> {
    return this.productRepository.getDistinctBrands();
  }

  /**
   * Get distinct genders
   */
  async getDistinctGenders(): Promise<string[]> {
    return this.productRepository.getDistinctGenders();
  }
}

export default new ProductService();
