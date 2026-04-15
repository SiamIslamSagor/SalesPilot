/* ============================
   Product Types
   Unified type definitions for Product and ProductVariant
   ============================ */

export interface ProductVariant {
  id?: string;
  size?: string;
  color?: string;
  colorCode?: string;
  sku?: string;
  price?: number;
}

export interface Product {
  _id?: string; // MongoDB _id
  id: string; // Virtual id (mapped from _id)
  productNumber: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  gender: string;
  fabrics: string;
  purchasePrice: number;
  salesPrice: number;
  margin: number;
  status: "active" | "inactive";
  images: string[];
  imageUrl?: string; // Optional for backward compatibility
  variants: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImportData {
  productNumber: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  gender: string;
  fabrics: string;
  purchasePrice: number;
  salesPrice: number;
  images: string[];
  color?: string;
  colorCode?: string;
  sizeName?: string;
  variantPrice?: number;
  variants?: ProductVariant[];
}

export interface ProductImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  failedCount: number;
  errors?: string[];
}
