import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { runMigrations } from "@/lib/db/migrate";
import { assertSessionSecretConfigured } from "@/lib/auth/constants";

let sqlite: Database.Database | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let initialized = false;

export function getDatabasePath() {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "unihomelabdash.sqlite");
}

export function getDb() {
  assertSessionSecretConfigured();

  if (!sqlite) {
    const databasePath = getDatabasePath();
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    sqlite = new Database(databasePath);
  }

  if (!initialized) {
    runMigrations(sqlite);
    ensureLegacyServiceColumns(sqlite);
    initialized = true;
  }

  if (!db) {
    db = drizzle(sqlite, { schema });
  }

  return db;
}

function ensureLegacyServiceColumns(database: Database.Database) {
  ensureColumn(database, "services", "health_status", "TEXT NOT NULL DEFAULT 'unknown'");
  ensureColumn(database, "services", "health_error_message", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(database, "services", "last_checked_at", "TEXT");
}

function ensureColumn(database: Database.Database, table: string, column: string, definition: string) {
  const existingColumns = database
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;

  if (!existingColumns.some((item) => item.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
