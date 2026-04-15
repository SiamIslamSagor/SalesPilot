export interface ProductVariant {
  id?: string;
  size: string;
  color?: string;
  colorCode: string;
  sku?: string;
  price?: number;
}

export interface Product {
  id: string;
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
  variants: ProductVariant[];
  countryOfOrigin?: string;
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
  countryOfOrigin?: string;
}

export interface ProductImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  failedCount: number;
  errors?: string[];
}
