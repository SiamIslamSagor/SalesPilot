import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockProductRepo, mockOffer } = vi.hoisted(() => ({
  mockProductRepo: {
    findAllPaginated: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getDistinctCategories: vi.fn(),
    getDistinctBrands: vi.fn(),
    getDistinctGenders: vi.fn(),
  },
  mockOffer: {
    countDocuments: vi.fn(),
  },
}));

vi.mock("../repositories/product.repository", () => ({
  default: mockProductRepo,
}));
vi.mock("../models/offer.model", () => ({
  default: mockOffer,
}));
vi.mock("../utils/cloudinary", () => ({
  uploadToCloudinary: vi.fn().mockResolvedValue("https://cdn/img.jpg"),
}));
vi.mock("../utils/logger", () => ({
  default: { debug: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import productService from "../services/product.service";

describe("product.service", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("getAllProducts", () => {
    it("returns paginated products", async () => {
      const products = [{ _id: "p1", name: "Shirt" }];
      mockProductRepo.findAllPaginated.mockResolvedValue({
        products,
        total: 1,
      });

      const result = await productService.getAllProducts({
        page: 1,
        limit: 10,
      });
      expect(result.products).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it("applies search filter", async () => {
      mockProductRepo.findAllPaginated.mockResolvedValue({
        products: [],
        total: 0,
      });

      await productService.getAllProducts({ search: "polo" });
      const filter = mockProductRepo.findAllPaginated.mock.calls[0][0];
      expect(filter.$or).toBeDefined();
    });

    it("caps limit at 500", async () => {
      mockProductRepo.findAllPaginated.mockResolvedValue({
        products: [],
        total: 0,
      });

      const result = await productService.getAllProducts({ limit: 1000 });
      expect(result.pagination.limit).toBe(500);
    });
  });

  describe("getProductById", () => {
    it("delegates to repository", async () => {
      const product = { _id: "p1", name: "Shirt" };
      mockProductRepo.findById.mockResolvedValue(product);

      const result = await productService.getProductById("p1");
      expect(result).toEqual(product);
    });
  });

  describe("createProduct", () => {
    it("calculates margin and creates product", async () => {
      const created = { _id: "p1", name: "Shirt", margin: 50 };
      mockProductRepo.create.mockResolvedValue(created);

      const result = await productService.createProduct({
        productNumber: "PN001",
        name: "Shirt",
        description: "",
        category: "Tops",
        brand: "Brand",
        gender: "Unisex",
        fabrics: "Cotton",
        purchasePrice: 5,
        salesPrice: 10,
        images: [],
        countryOfOrigin: "FI",
      });

      expect(result).toEqual(created);
      const arg = mockProductRepo.create.mock.calls[0][0];
      expect(arg.margin).toBe(50);
    });

    it("sets margin to 0 when salesPrice is 0", async () => {
      mockProductRepo.create.mockResolvedValue({});
      await productService.createProduct({
        productNumber: "PN002",
        name: "Free item",
        description: "",
        category: "",
        brand: "",
        gender: "",
        fabrics: "",
        purchasePrice: 0,
        salesPrice: 0,
        images: [],
        countryOfOrigin: "",
      });
      const arg = mockProductRepo.create.mock.calls[0][0];
      expect(arg.margin).toBe(0);
    });

    it("uploads base64 images", async () => {
      mockProductRepo.create.mockResolvedValue({});
      await productService.createProduct({
        productNumber: "PN003",
        name: "Img product",
        description: "",
        category: "",
        brand: "",
        gender: "",
        fabrics: "",
        purchasePrice: 5,
        salesPrice: 10,
        images: ["data:image/png;base64,abc"],
        countryOfOrigin: "",
      });
      const arg = mockProductRepo.create.mock.calls[0][0];
      expect(arg.images[0]).toBe("https://cdn/img.jpg");
    });
  });

  describe("updateProduct", () => {
    it("delegates to repository", async () => {
      const updated = { _id: "p1", name: "Updated" };
      mockProductRepo.update.mockResolvedValue(updated);

      const result = await productService.updateProduct("p1", {
        name: "Updated",
      } as never);
      expect(result).toEqual(updated);
    });
  });

  describe("deleteProduct", () => {
    it("deletes when no active offers reference product", async () => {
      mockOffer.countDocuments.mockResolvedValue(0);
      mockProductRepo.delete.mockResolvedValue({ _id: "p1" });

      const result = await productService.deleteProduct("p1");
      expect(result).toBeDefined();
    });

    it("throws when product is in active offers", async () => {
      mockOffer.countDocuments.mockResolvedValue(2);

      await expect(productService.deleteProduct("p1")).rejects.toThrow(
        "Cannot delete product",
      );
    });
  });

  describe("getDistinct*", () => {
    it("returns distinct categories", async () => {
      mockProductRepo.getDistinctCategories.mockResolvedValue([
        "Shirts",
        "Pants",
      ]);
      const result = await productService.getDistinctCategories();
      expect(result).toEqual(["Shirts", "Pants"]);
    });

    it("returns distinct brands", async () => {
      mockProductRepo.getDistinctBrands.mockResolvedValue(["Nike"]);
      const result = await productService.getDistinctBrands();
      expect(result).toEqual(["Nike"]);
    });

    it("returns distinct genders", async () => {
      mockProductRepo.getDistinctGenders.mockResolvedValue(["Unisex"]);
      const result = await productService.getDistinctGenders();
      expect(result).toEqual(["Unisex"]);
    });
  });
});
