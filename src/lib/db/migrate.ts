import fs from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { drizzle } from "drizzle-orm/better-sqlite3";

export function runMigrations(sqlite: Database.Database) {
  const db = drizzle(sqlite);
  const migrationsFolder = path.join(process.cwd(), "drizzle");

  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(`Drizzle migrations folder not found: ${migrationsFolder}`);
  }

  migrate(db, { migrationsFolder });
}
