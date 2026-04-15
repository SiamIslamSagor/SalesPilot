import mongoose from "mongoose";
import path from "path";
import fs from "fs";

interface MigrationRecord {
  name: string;
  appliedAt: Date;
}

/**
 * Lightweight migration runner.
 * - Tracks applied migrations in a `migrations` collection.
 * - Scans `src/migrations/` for files matching `NNN_*.ts` (or `.js` in dist).
 * - Each migration exports `name: string` and `up(): Promise<void>`.
 */
export async function runMigrations(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const migrationsCol = db.collection<MigrationRecord>("migrations");

  // Ensure index on name for fast lookups
  await migrationsCol.createIndex({ name: 1 }, { unique: true });

  // Determine migration directory (works for both ts-node-dev and compiled js)
  const migrationsDir = path.resolve(__dirname, "..", "migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.log("⚠️  No migrations directory found, skipping migrations");
    return;
  }

  // Get list of migration files sorted by name
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d{3}_.*\.(ts|js)$/.test(f) && !f.endsWith(".d.ts"))
    .sort();

  if (files.length === 0) {
    console.log("ℹ️  No migration files found");
    return;
  }

  // Get already-applied migration names
  const applied = new Set(
    (await migrationsCol.find({}).toArray()).map((m) => m.name),
  );

  let ranCount = 0;
  for (const file of files) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const migration = require(path.join(migrationsDir, file));
    const migrationName: string = migration.name;

    if (applied.has(migrationName)) {
      continue;
    }

    console.log(`🔄 Running migration: ${migrationName}`);
    await migration.up();
    await migrationsCol.insertOne({
      name: migrationName,
      appliedAt: new Date(),
    });
    ranCount++;
    console.log(`✅ Completed migration: ${migrationName}`);
  }

  if (ranCount === 0) {
    console.log("ℹ️  All migrations already applied");
  } else {
    console.log(`🎉 Ran ${ranCount} migration(s) successfully`);
  }
}
