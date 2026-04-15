import mongoose from "mongoose";

export const name = "004_nullify_empty_business_ids";

/**
 * Convert all empty-string businessId values to null so the sparse unique
 * index properly ignores them and prevents duplicate-key errors.
 */
export async function up(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const customersCol = db.collection("customers");

  // Also handle null values that may have been set previously
  const result = await customersCol.updateMany(
    { $or: [{ businessId: "" }, { businessId: null }] },
    { $unset: { businessId: "" } },
  );

  console.log(
    `  Updated ${result.modifiedCount} customers: removed empty/null businessId`,
  );
}
