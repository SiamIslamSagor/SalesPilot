/**
 * Excel Helper Utilities for Product Import
 *
 * This module provides helper functions for parsing Excel files with
 * multiple column formats (Finnish and English) and converting them
 * into product data structures.
 */

/**
 * Column mapping for Format A (Finnish columns)
 */
export const FINNISH_COLUMNS: Record<string, string[]> = {
  productNumber: ["Product number"],
  brand: ["Brand"],
  name: ["Product name (fi)"],
  category: ["Category (fi)"],
  description: ["Description (fi)"],
  fabrics: ["Fabrics (fi)"],
  gender: ["Gender (fi)"],
  purchasePrice: ["Jälleenmyyjän hinta"],
  salesPrice: ["Ohjevähittäishinta"],
  color: ["Color (fi)"],
  images: ["All images"],
  colorCode: ["Color code"],
  size: ["Size name"],
  countryOfOrigin: [], // Not available in Finnish format
};

/**
 * Column mapping for Format B (English columns)
 */
export const ENGLISH_COLUMNS: Record<string, string[]> = {
  productNumber: ["Product number"],
  brand: ["Brand"],
  name: ["Product name (en)"],
  category: ["Category (en)"],
  description: ["Description (en)"],
  fabrics: ["Fabrics (en)"],
  gender: ["Gender (en)"],
  purchasePrice: ["Wholesale price"],
  salesPrice: ["Suggested retail price"],
  color: ["Color (en)"],
  images: ["All images"],
  colorCode: ["Color code"],
  size: ["Size name"],
  countryOfOrigin: ["Country of origin"],
};

/**
 * Excel format type
 */
export type ExcelFormat = "finnish" | "english" | "unknown";

/**
 * Get the first existing column value from an array of column names
 *
 * @param row - The Excel row as a key-value object
 * @param columnNames - Array of column names to check (in priority order)
 * @returns The first non-empty value found, or undefined if none exist
 *
 * @example
 * ```typescript
 * const name = getValue(row, ["Product name (fi)", "Product name (en)"]);
 * // Returns "Classic T-Shirt" if the Finnish column exists
 * ```
 */
export function getValue(
  row: Record<string, unknown>,
  columnNames: string[],
): string | undefined {
  for (const col of columnNames) {
    const value = row[col];
    if (value !== undefined && value !== null && value !== "") {
      return String(value).trim();
    }
  }
  return undefined;
}

/**
 * Parse price values that may contain € symbol
 *
 * Handles formats:
 * - "12.90"
 * - "€12.90"
 * - "12,90€"
 * - "12.90 €"
 * - "12,90 €"
 *
 * @param value - The price value to parse
 * @returns The parsed price as a number, or 0 if parsing fails
 *
 * @example
 * ```typescript
 * const price1 = parsePrice("12.90"); // 12.90
 * const price2 = parsePrice("€12,90"); // 12.90
 * const price3 = parsePrice("invalid"); // 0
 * ```
 */
export function parsePrice(value: unknown): number {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  let priceStr = String(value);
  // Remove € symbol and whitespace
  priceStr = priceStr.replace(/[€\s]/g, "");
  // Replace comma with dot for decimal separator
  priceStr = priceStr.replace(",", ".");

  const parsed = parseFloat(priceStr);
  // Validate that price is not negative
  if (isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

/**
 * Parse comma-separated image URLs into an array
 *
 * @param value - The comma-separated image URLs
 * @returns Array of trimmed image URLs, or empty array if parsing fails
 *
 * @example
 * ```typescript
 * const images = parseImages("https://example.com/img1.jpg, https://example.com/img2.jpg");
 * // Returns ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]
 * ```
 */
export function parseImages(value: unknown): string[] {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  const imagesStr = String(value);
  return imagesStr
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

/**
 * Normalize size values
 *
 * Converts various "no size" representations to "One Size"
 *
 * @param size - The size value to normalize
 * @returns Normalized size value
 *
 * @example
 * ```typescript
 * normalizeSize("no size"); // "One Size"
 * normalizeSize("No size"); // "One Size"
 * normalizeSize("NO SIZE"); // "One Size"
 * normalizeSize("M"); // "M"
 * ```
 */
export function normalizeSize(size: string): string {
  const normalized = size.trim().toLowerCase();
  if (normalized === "no size" || normalized === "nosize") {
    return "One Size";
  }
  return size.trim();
}

/**
 * Detect the Excel format based on column names
 *
 * @param row - The first row of the Excel file (header row)
 * @returns The detected format: 'finnish', 'english', or 'unknown'
 *
 * @example
 * ```typescript
 * const format = detectExcelFormat(firstRow);
 * // Returns 'finnish' if Finnish-specific columns are detected
 * ```
 */
export function detectExcelFormat(row: Record<string, unknown>): ExcelFormat {
  const columns = Object.keys(row).map((col) => col.toLowerCase());

  const finnishIndicators = [
    "jälleenmyyjän hinta",
    "ohjevähittäishinta",
    "product name (fi)",
    "category (fi)",
    "description (fi)",
    "fabrics (fi)",
    "gender (fi)",
    "color (fi)",
  ];

  const englishIndicators = [
    "wholesale price",
    "suggested retail price",
    "product name (en)",
    "category (en)",
    "description (en)",
    "fabrics (en)",
    "gender (en)",
    "color (en)",
    "country of origin",
  ];

  const finnishCount = finnishIndicators.filter((indicator) =>
    columns.some((col) => col.includes(indicator)),
  ).length;

  const englishCount = englishIndicators.filter((indicator) =>
    columns.some((col) => col.includes(indicator)),
  ).length;

  if (finnishCount > englishCount) return "finnish";
  if (englishCount > finnishCount) return "english";
  return "unknown";
}

/**
 * Create a unique key for variant deduplication
 *
 * @param size - The variant size
 * @param color - The variant color (optional)
 * @returns A unique string key for the variant
 *
 * @example
 * ```typescript
 * const key1 = createVariantKey("M", "Red"); // "m:red"
 * const key2 = createVariantKey("M", "Red"); // "m:red" (same as key1)
 * const key3 = createVariantKey("L", "Red"); // "l:red" (different)
 * ```
 */
export function createVariantKey(
  size: string,
  color: string | undefined,
): string {
  return `${size.toLowerCase()}:${color?.toLowerCase() || ""}`;
}

/**
 * Get the appropriate column mapping based on the detected format
 *
 * @param format - The detected Excel format
 * @returns The column mapping object for the format
 * @throws Error if format is unknown
 *
 * @example
 * ```typescript
 * const columns = getColumnMapping('finnish');
 * // Returns FINNISH_COLUMNS
 * ```
 */
export function getColumnMapping(
  format: ExcelFormat,
): Record<string, string[]> {
  if (format === "finnish") {
    return FINNISH_COLUMNS;
  }
  if (format === "english") {
    return ENGLISH_COLUMNS;
  }
  throw new Error(`Unknown Excel format: ${format}`);
}

/**
 * Validate that required columns exist in the Excel file
 *
 * @param row - The first row of the Excel file (header row)
 * @param requiredColumns - Array of required column names
 * @returns Array of missing column names (empty if all required columns exist)
 *
 * @example
 * ```typescript
 * const missing = validateRequiredColumns(firstRow, ["Product number", "Product name (fi)"]);
 * // Returns [] if all columns exist
 * // Returns ["Missing column"] if any column is missing
 * ```
 */
export function validateRequiredColumns(
  row: Record<string, unknown>,
  requiredColumns: string[],
): string[] {
  const rowColumns = Object.keys(row).map((col) => col.toLowerCase());
  const missingColumns: string[] = [];

  for (const col of requiredColumns) {
    const exists = rowColumns.some((rowCol) => rowCol === col.toLowerCase());
    if (!exists) {
      missingColumns.push(col);
    }
  }

  return missingColumns;
}

/**
 * Trim and clean a string value
 *
 * @param value - The value to clean
 * @returns The cleaned string, or empty string if value is falsy
 *
 * @example
 * ```typescript
 * cleanString("  Hello World  "); // "Hello World"
 * cleanString(null); // ""
 * ```
 */
export function cleanString(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  return String(value).trim();
}

/**
 * Calculate margin percentage
 *
 * @param purchasePrice - The purchase price
 * @param salesPrice - The sales price
 * @returns The margin percentage (0 if sales price is 0)
 *
 * @example
 * ```typescript
 * const margin = calculateMargin(4.50, 12.90); // 65.12
 * ```
 */
export function calculateMargin(
  purchasePrice: number,
  salesPrice: number,
): number {
  if (salesPrice === 0) return 0;
  return ((salesPrice - purchasePrice) / salesPrice) * 100;
}
