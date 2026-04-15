# Product Import API Documentation

## Overview

This API allows you to import products from Excel files (.xlsx or .xls) into the system. The importer **automatically detects and supports both Finnish and English Excel formats** without requiring manual configuration.

## Endpoint

```
POST /api/products/import
```

## Request

- **Method**: POST
- **Content-Type**: multipart/form-data
- **Body**:
  - `file`: The Excel file to import

## File Requirements

- **Format**: .xlsx or .xls
- **Size**: Maximum 5MB
- **Encoding**: UTF-8

## Excel File Formats

The importer automatically detects which format your Excel file uses based on column names. No manual configuration is required.

### Format A: Finnish Columns

| Column Name         | Type         | Description                            | Example                                                      |
| ------------------- | ------------ | -------------------------------------- | ------------------------------------------------------------ |
| Product number      | String       | Unique product identifier              | "TS-001"                                                     |
| Brand               | String       | Product brand                          | "ProWear"                                                    |
| Product name (fi)   | String       | Product name (Finnish)                 | "Klassinen T-paita"                                          |
| Category (fi)       | String       | Product category (Finnish)             | "T-paidat"                                                   |
| Description (fi)    | String       | Product description (Finnish)          | "Laadukas puuvilla T-paita"                                  |
| Fabrics (fi)        | String       | Fabric information (Finnish)           | "100% puuvilla"                                              |
| Gender (fi)         | String       | Target gender (Finnish)                | "Unisex"                                                     |
| Jälleenmyyjän hinta | Number/Price | Wholesale price (may contain €)        | "4,50 €"                                                     |
| Ohjevähittäishinta  | Number/Price | Suggested retail price (may contain €) | "12,90 €"                                                    |
| Color (fi)          | String       | Color name (Finnish)                   | "Punainen"                                                   |
| All images          | String       | Comma-separated image URLs             | "https://example.com/img1.jpg, https://example.com/img2.jpg" |
| Color code          | String       | Color code                             | "#FF0000"                                                    |
| Size name           | String       | Variant size                           | "M"                                                          |

### Format B: English Columns

| Column Name            | Type         | Description                            | Example                                                      |
| ---------------------- | ------------ | -------------------------------------- | ------------------------------------------------------------ |
| Product number         | String       | Unique product identifier              | "TS-001"                                                     |
| Brand                  | String       | Product brand                          | "ProWear"                                                    |
| Product name (en)      | String       | Product name (English)                 | "Classic T-Shirt"                                            |
| Category (en)          | String       | Product category (English)             | "T-Shirts"                                                   |
| Description (en)       | String       | Product description (English)          | "Premium cotton t-shirt"                                     |
| Fabrics (en)           | String       | Fabric information (English)           | "100% cotton"                                                |
| Gender (en)            | String       | Target gender (English)                | "Unisex"                                                     |
| Wholesale price        | Number/Price | Wholesale price (may contain €)        | "4.50 €"                                                     |
| Suggested retail price | Number/Price | Suggested retail price (may contain €) | "12.90 €"                                                    |
| Color (en)             | String       | Color name (English)                   | "Red"                                                        |
| All images             | String       | Comma-separated image URLs             | "https://example.com/img1.jpg, https://example.com/img2.jpg" |
| Color code             | String       | Color code                             | "#FF0000"                                                    |
| Size name              | String       | Variant size                           | "M"                                                          |
| Country of origin      | String       | Country of origin (optional)           | "Finland"                                                    |

### Shared Columns (Both Formats)

The following columns are required in both formats:

- **Product number** - Required
- **Brand** - Optional (defaults to "Unknown")
- **All images** - Optional (defaults to empty array)
- **Color code** - Required for variants
- **Size name** - Required for variants

## Example Excel Data

### Format A (Finnish) Example

| Product number | Brand   | Product name (fi) | Category (fi) | Gender (fi) | Jälleenmyyjän hinta | Ohjevähittäishinta | Color (fi) | Color code | Size name | All images                      |
| -------------- | ------- | ----------------- | ------------- | ----------- | ------------------- | ------------------ | ---------- | ---------- | --------- | ------------------------------- |
| TS-001         | ProWear | Klassinen T-paita | T-paidat      | Unisex      | 4,50 €              | 12,90 €            | Punainen   | #FF0000    | M         | https://example.com/tshirt1.jpg |
| TS-001         | ProWear | Klassinen T-paita | T-paidat      | Unisex      | 4,50 €              | 12,90 €            | Punainen   | #FF0000    | L         | https://example.com/tshirt1.jpg |
| TS-002         | ProWear | Urheilu T-paita   | T-paidat      | Mies        | 6,20 €              | 16,50 €            | Sininen    | #0000FF    | M         | https://example.com/tshirt2.jpg |

### Format B (English) Example

| Product number | Brand   | Product name (en)   | Category (en) | Gender (en) | Wholesale price | Suggested retail price | Color (en) | Color code | Size name | All images                      | Country of origin |
| -------------- | ------- | ------------------- | ------------- | ----------- | --------------- | ---------------------- | ---------- | ---------- | --------- | ------------------------------- | ----------------- |
| TS-001         | ProWear | Classic T-Shirt     | T-Shirts      | Unisex      | 4.50 €          | 12.90 €                | Red        | #FF0000    | M         | https://example.com/tshirt1.jpg | Finland           |
| TS-001         | ProWear | Classic T-Shirt     | T-Shirts      | Unisex      | 4.50 €          | 12.90 €                | Red        | #FF0000    | L         | https://example.com/tshirt1.jpg | Finland           |
| TS-002         | ProWear | Performance T-Shirt | T-Shirts      | Men         | 6.20 €          | 16.50 €                | Blue       | #0000FF    | M         | https://example.com/tshirt2.jpg | Finland           |

## Data Processing Features

### Automatic Format Detection

The importer automatically detects the Excel format by analyzing column names:

- **Finnish format**: Detected if columns like "Jälleenmyyjän hinta", "Product name (fi)", etc. are present
- **English format**: Detected if columns like "Wholesale price", "Product name (en)", etc. are present
- **Unknown format**: Error is thrown if format cannot be determined

### Price Parsing

The importer handles various price formats:

- `12.90`
- `€12.90`
- `12,90€`
- `12.90 €`
- `12,90 €`

All prices are parsed as numbers and stored in the database.

### Image Parsing

The `All images` column supports comma-separated URLs:

- `https://example.com/img1.jpg, https://example.com/img2.jpg`
- URLs are trimmed and empty strings are filtered out
- Results in an array of image URLs in the database

### Size Normalization

The importer automatically normalizes size values:

- `"no size"`, `"No size"`, `"NO SIZE"` → `"One Size"`
- Other sizes are trimmed but not modified

### Variant Deduplication

When multiple rows have the same `productNumber`:

- Rows are grouped by `productNumber`
- Variants are created from each row
- Duplicate variants (same size + color combination) are automatically skipped
- Each product document contains all unique variants

### Optional Field Handling

The `Country of origin` column (Format B only) is optional:

- If present, the value is stored in the database
- If missing, the field is ignored (no error)

### Automatic Calculations

- **Margin**: Automatically calculated as `(salesPrice - purchasePrice) / salesPrice * 100`
- **Status**: Set to "active" by default for all imported products

## Response

### Success Response

```json
{
  "success": true,
  "message": "Successfully imported 2 new products and updated 1 existing products",
  "data": {
    "importedCount": 2,
    "failedCount": 0,
    "errors": null
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Missing required columns in Excel file: Product number, Product name (fi)"
}
```

### Format Detection Error

```json
{
  "success": false,
  "message": "Unable to detect Excel format. Please ensure the file uses either Finnish or English column names."
}
```

## Behavior

### Product Matching

- The system uses `productNumber` to identify products
- If a product with the same `productNumber` exists, it will be **updated**
- If the `productNumber` doesn't exist, a new product will be **created**
- The update operation uses MongoDB's `bulkWrite` with `upsert: true` for efficiency

### Bulk Operations

The importer is optimized for large files:

- Uses MongoDB's native `bulkWrite` operation
- Processes all products in a single database transaction
- Supports files with 10,000+ rows efficiently
- Returns counts of created and updated products

### Validation

- All required columns must be present
- Prices must be non-negative numbers
- Product numbers must be unique within the file
- File size must not exceed 5MB
- Only Excel files (.xlsx, .xls) are accepted
- Excel format must be detectable (Finnish or English)

## Error Handling

### Common Errors

| Error                                        | Cause                             | Solution                                         |
| -------------------------------------------- | --------------------------------- | ------------------------------------------------ |
| "No file uploaded"                           | No file was sent with the request | Ensure a file is attached to the request         |
| "Only Excel files (.xlsx, .xls) are allowed" | Invalid file type                 | Upload a valid Excel file                        |
| "File size exceeds the 5MB limit"            | File is too large                 | Compress or split the file                       |
| "Excel file is empty"                        | File has no data rows             | Add product data to the file                     |
| "Missing required columns in Excel file"     | Required columns are missing      | Ensure all required columns are present          |
| "Unable to detect Excel format"              | Format cannot be determined       | Use Finnish or English column names as specified |
| "Validation failed with X error(s)"          | Invalid data in rows              | Check console for detailed error messages        |

## Frontend Integration

### React Component Example

```tsx
import { useState } from "react";

function ProductImport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://localhost:5000/api/products/import",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Import Products</h2>
      <p>Supports both Finnish and English Excel formats</p>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? "Importing..." : "Import Products"}
      </button>

      {result && (
        <div>
          <h3>Import Result</h3>
          <p>{result.message}</p>
          <p>Created: {result.data?.importedCount}</p>
          <p>
            Updated: {result.data?.importedCount - result.data?.failedCount}
          </p>
        </div>
      )}
    </div>
  );
}
```

## Vercel Deployment Notes

The import functionality uses **memory storage** for file uploads, which is compatible with Vercel's serverless environment. No additional configuration is required for Vercel deployment.

## Performance Considerations

- **Large Files**: The importer is optimized to handle files with 10,000+ rows efficiently
- **Bulk Operations**: Uses MongoDB's `bulkWrite` for optimal database performance
- **Memory Efficiency**: Processes data in memory-efficient structures to handle large datasets
- **Automatic Format Detection**: No manual configuration needed, reducing user errors

## Rate Limiting

Currently, there is no rate limiting on the import endpoint. Consider implementing rate limiting for production use to prevent abuse.

## Security Considerations

- File size limits are enforced (5MB)
- File type validation is performed
- Input validation is applied to all product data
- Automatic format detection prevents injection attacks
- Consider adding authentication/authorization middleware for production use

## Changelog

### Version 2.0 (Current)

- ✅ Added automatic format detection (Finnish/English)
- ✅ Added support for both Finnish and English column formats
- ✅ Added price parsing with € symbol support
- ✅ Added image parsing for comma-separated URLs
- ✅ Added size normalization ("no size" → "One Size")
- ✅ Added variant deduplication
- ✅ Added optional "Country of origin" field
- ✅ Optimized repository to use MongoDB `bulkWrite` with `upsert: true`
- ✅ Added helper utilities for flexible column mapping
- ✅ Improved error messages and validation

### Version 1.0 (Previous)

- Basic Excel import with Finnish format only
- Manual column mapping
- Limited validation
