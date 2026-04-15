import mongoose from "mongoose";
import crypto from "crypto";

/**
 * Migration: Backfill accessCode for existing offers that don't have one.
 * Each offer gets a unique 64-char hex string generated via crypto.randomBytes(32).
 */
export const name = "001_backfill_offer_access_codes";

export async function up(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const offersCollection = db.collection("offers");

  // Find all offers missing an accessCode
  const cursor = offersCollection.find({
    $or: [{ accessCode: { $exists: false } }, { accessCode: null }, { accessCode: "" }],
  });

  let updatedCount = 0;
  for await (const doc of cursor) {
    const accessCode = crypto.randomBytes(32).toString("hex");
    await offersCollection.updateOne(
      { _id: doc._id },
      { $set: { accessCode } },
    );
    updatedCount++;
  }

  console.log(`  ✅ Backfilled accessCode for ${updatedCount} offers`);
}
