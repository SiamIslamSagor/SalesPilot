import { Request, Response } from "express";
import ProductService from "../services/product.service";
import { ProductImportResult } from "../types/product.types";

const productService = ProductService;

/**
 * Import products from Excel file
 */
const importProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse Excel file
    const products = await productService.parseExcelFile(req);

    // Import products
    const result: ProductImportResult =
      await productService.importProducts(products);

    res.status(200).json({
      success: result.success,
      message: result.message,
      data: {
        importedCount: result.importedCount,
        failedCount: result.failedCount,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error("Error importing products:", error);
    const message =
      error instanceof Error ? error.message : "Failed to import products";
    res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * Get all products
 */
const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page
      ? parseInt(req.query.page as string, 10)
      : undefined;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : undefined;
    const category = req.query.category as string;
    const brand = req.query.brand as string;
    const gender = req.query.gender as string;
    const search = req.query.search as string;
    const ids = req.query.ids
      ? (req.query.ids as string).split(",")
      : undefined;
    const productNumbers = req.query.productNumbers
      ? (req.query.productNumbers as string).split(",")
      : undefined;

    const result = await productService.getAllProducts({
      page,
      limit,
      category,
      brand,
      gender,
      search,
      ids,
      productNumbers,
    });

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

/**
 * Get product by ID
 */
const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

/**
 * Create a new product
 */
const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create product",
    });
  }
};

/**
 * Update a product
 */
const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update product",
    });
  }
};

/**
 * Delete a product
 */
const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await productService.deleteProduct(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

/**
 * Get distinct categories
 */
const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await productService.getDistinctCategories();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

/**
 * Get distinct brands
 */
const getBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const brands = await productService.getDistinctBrands();
    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brands",
    });
  }
};

/**
 * Get distinct genders
 */
const getGenders = async (req: Request, res: Response): Promise<void> => {
  try {
    const genders = await productService.getDistinctGenders();
    res.status(200).json({
      success: true,
      data: genders,
    });
  } catch (error) {
    console.error("Error fetching genders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch genders",
    });
  }
};

const productController = {
  importProducts,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getBrands,
  getGenders,
};

export default productController;
