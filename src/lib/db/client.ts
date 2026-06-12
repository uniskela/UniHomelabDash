import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";

let sqlite: Database.Database | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let initialized = false;

export function getDatabasePath() {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "unihomelabdash.sqlite");
}

export function getDb() {
  if (!sqlite) {
    const databasePath = getDatabasePath();
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    sqlite = new Database(databasePath);
  }

  if (!initialized) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'General',
        host TEXT NOT NULL DEFAULT '',
        icon TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        health_url TEXT NOT NULL DEFAULT '',
        health_status TEXT NOT NULL DEFAULT 'unknown',
        last_checked_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    ensureColumn("services", "health_status", "TEXT NOT NULL DEFAULT 'unknown'");
    ensureColumn("services", "health_error_message", "TEXT NOT NULL DEFAULT ''");
    ensureColumn("services", "last_checked_at", "TEXT");
    initialized = true;
  }

  if (!db) {
    db = drizzle(sqlite, { schema });
  }

  return db;
}

function ensureColumn(table: string, column: string, definition: string) {
  if (!sqlite) {
    return;
  }

  const existingColumns = sqlite
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;

  if (!existingColumns.some((item) => item.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
