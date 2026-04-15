import mongoose from "mongoose";
import { FinnishBusinessIds } from "finnish-business-ids";

export const name = "003_validate_customer_business_ids";

/**
 * Validate all existing customer businessId fields using the finnish-business-ids package.
 * Invalid business IDs are removed ($unset) so they don't block future updates.
 * Also ensures the businessId index is sparse+unique so null/missing values don't conflict.
 */
export async function up(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const customersCol = db.collection("customers");

  // Ensure the businessId index is sparse + unique.
  // Drop the old non-sparse index if it exists, then recreate.
  try {
    await customersCol.dropIndex("businessId_1");
    console.log("  Dropped old businessId_1 index");
  } catch {
    // Index may not exist — that's fine
  }
  await customersCol.createIndex(
    { businessId: 1 },
    { unique: true, sparse: true },
  );
  console.log("  Created sparse unique index on businessId");

  // Find all customers that have a non-empty businessId
  const customers = await customersCol
    .find({
      businessId: { $exists: true, $nin: ["", null] },
    })
    .project({ _id: 1, businessId: 1, companyName: 1 })
    .toArray();

  console.log(
    `  Found ${customers.length} customers with a businessId to validate`,
  );

  let invalidCount = 0;

  for (const customer of customers) {
    const rawId = String(customer.businessId).trim();
    if (!rawId) continue;

    if (!FinnishBusinessIds.isValidBusinessId(rawId)) {
      invalidCount++;
      console.log(
        `  ⚠️  Invalid businessId "${rawId}" for customer "${customer.companyName}" (${customer._id}) — removing field`,
      );
      await customersCol.updateOne(
        { _id: customer._id },
        { $unset: { businessId: "" } },
      );
    }
  }

  if (invalidCount === 0) {
    console.log("  ✅ All existing business IDs are valid");
  } else {
    console.log(`  🔧 Cleared ${invalidCount} invalid business ID(s)`);
  }
}
