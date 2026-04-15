import ProductModel, { IProductDocument } from "../models/product.model";
import { Product } from "../types/product.types";

export interface ProductQuery {
  status?: string;
  category?: string;
  brand?: string;
  gender?: string;
  search?: string;
  page?: number;
  limit?: number;
  skip?: number;
}

export class ProductRepository {
  async findByProductNumber(
    productNumber: string,
  ): Promise<IProductDocument | null> {
    return ProductModel.findOne({ productNumber });
  }

  async create(productData: Omit<Product, "id">): Promise<IProductDocument> {
    return ProductModel.create(productData);
  }

  async createMany(
    productsData: Omit<Product, "id">[],
  ): Promise<IProductDocument[]> {
    return ProductModel.insertMany(productsData);
  }

  async findAll(query?: ProductQuery): Promise<IProductDocument[]> {
    const { skip, limit, ...filter } = query || {};
    let queryBuilder = ProductModel.find(filter);

    if (skip !== undefined) {
      queryBuilder = queryBuilder.skip(skip);
    }

    if (limit !== undefined) {
      queryBuilder = queryBuilder.limit(limit);
    }

    return queryBuilder.lean().exec() as Promise<IProductDocument[]>;
  }

  async findAllPaginated(
    filter: Record<string, unknown>,
    options?: { skip?: number; limit?: number },
  ): Promise<{ products: IProductDocument[]; total: number }> {
    const findQuery = ProductModel.find(filter)
      .skip(options?.skip || 0)
      .limit(options?.limit || 0)
      .lean();

    const [products, total] = await Promise.all([
      findQuery.exec() as Promise<IProductDocument[]>,
      ProductModel.countDocuments(filter),
    ]);

    return { products, total };
  }

  async count(query?: ProductQuery): Promise<number> {
    const filter = query ? { ...query } : {};
    delete filter.skip;
    delete filter.limit;
    delete filter.page;
    return ProductModel.countDocuments(filter);
  }

  async findById(id: string): Promise<IProductDocument | null> {
    return ProductModel.findById(id);
  }

  async findByIds(ids: string[]): Promise<(IProductDocument | null)[]> {
    const products = (await ProductModel.find({ _id: { $in: ids } })
      .lean()
      .exec()) as IProductDocument[];
    const map = new Map(
      products.map((p) => [(p._id as { toString(): string }).toString(), p]),
    );
    return ids.map((id) => map.get(id) || null);
  }

  async update(
    id: string,
    productData: Partial<Product>,
  ): Promise<IProductDocument | null> {
    return ProductModel.findByIdAndUpdate(id, productData, { new: true });
  }

  async delete(id: string): Promise<IProductDocument | null> {
    return ProductModel.findByIdAndDelete(id);
  }

  async bulkUpsert(
    products: Omit<Product, "id">[],
  ): Promise<{ created: number; updated: number }> {
    if (products.length === 0) {
      return { created: 0, updated: 0 };
    }

    const bulkOps = products.map((product) => ({
      updateOne: {
        filter: { productNumber: product.productNumber },
        update: { $set: product },
        upsert: true,
      },
    }));

    try {
      const result = await ProductModel.bulkWrite(bulkOps, { ordered: false });

      return {
        created: result.upsertedCount,
        updated: result.modifiedCount,
      };
    } catch (error) {
      // Log partial failures and re-throw with more context
      console.error("Bulk write error:", error);
      throw new Error(
        `Failed to bulk upsert products: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getDistinctCategories(): Promise<string[]> {
    const categories = await ProductModel.distinct("category");
    return categories.filter(
      (cat): cat is string => cat !== null && cat !== undefined && cat !== "",
    );
  }

  async getDistinctBrands(): Promise<string[]> {
    const brands = await ProductModel.distinct("brand");
    return brands.filter(
      (brand): brand is string =>
        brand !== null && brand !== undefined && brand !== "",
    );
  }

  async getDistinctGenders(): Promise<string[]> {
    const genders = await ProductModel.distinct("gender");
    return genders.filter(
      (gender): gender is string =>
        gender !== null && gender !== undefined && gender !== "",
    );
  }
}

export default new ProductRepository();
