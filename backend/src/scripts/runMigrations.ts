import "dotenv/config";
import mongoose from "mongoose";
import { runMigrations } from "../utils/migrationRunner";

/**
 * Standalone script to run database migrations.
 * Called during `vercel-build` after TypeScript compilation.
 *
 * Usage: node dist/scripts/runMigrations.js
 */
async function main() {
  const mongoUri = process.env.DATABASE_URL;
  if (!mongoUri) {
    console.warn(
      "⚠️ DATABASE_URL environment variable is not defined; skipping migrations",
    );
    return;
  }

  try {
    console.log("📦 Connecting to MongoDB for migrations...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    await runMigrations();

    await mongoose.disconnect();
    console.log("📦 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

main();
