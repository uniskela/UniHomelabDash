import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const databasePath =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "unihomelabdash.sqlite");
const migrationsFolder = path.join(process.cwd(), "drizzle");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const sqlite = new Database(databasePath);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder });
sqlite.close();

console.log(`Migrations applied to ${databasePath}`);
