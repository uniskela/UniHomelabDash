#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;
const BCRYPT_MAX_PASSWORD_BYTES = 72;
const MAX_USERNAME_LENGTH = 50;
const SETUP_COMPLETE_KEY = "setup_complete";

function parseArgs(argv) {
  const options = { confirm: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--confirm") {
      options.confirm = true;
      continue;
    }
    if (arg === "--username") {
      options.username = argv[index + 1]?.trim();
      index += 1;
      continue;
    }
    if (arg === "--password") {
      options.password = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }
  return options;
}

function printHelp() {
  console.log(`Reset the UniHomelabDash admin account in SQLite.

Usage:
  node scripts/reset-admin.mjs --username <name> --confirm [--password <password>]

Options:
  --username   Admin username (3-${MAX_USERNAME_LENGTH} characters)
  --password   New password (min 8 characters). If omitted, reads RESET_ADMIN_PASSWORD
               or prompts interactively.
  --confirm    Required. Applies the reset after printing a summary.

Environment:
  DATABASE_PATH         SQLite file (default: ./data/unihomelabdash.sqlite)
  RESET_ADMIN_PASSWORD  Non-interactive password when --password is omitted

Examples:
  npm run reset-admin -- --username admin --confirm
  docker compose exec unihomelabdash node scripts/reset-admin.mjs --username admin --confirm
`);
}

function passwordExceedsBcryptLimit(password) {
  return new TextEncoder().encode(password).length > BCRYPT_MAX_PASSWORD_BYTES;
}

function validateUsername(username) {
  if (!username || username.length < 3) {
    throw new Error("Username must be at least 3 characters.");
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    throw new Error(`Username must be at most ${MAX_USERNAME_LENGTH} characters.`);
  }
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (passwordExceedsBcryptLimit(password)) {
    throw new Error("Password must be at most 72 bytes.");
  }
}

async function resolvePassword(options) {
  if (options.password) {
    return options.password;
  }

  const fromEnv = process.env.RESET_ADMIN_PASSWORD;
  if (fromEnv) {
    return fromEnv;
  }

  const rl = createInterface({ input, output });
  try {
    return await rl.question("New admin password: ");
  } finally {
    rl.close();
  }
}

function upsertSetupComplete(db, now) {
  db.prepare(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (?, 'true', ?)
     ON CONFLICT(key) DO UPDATE SET value = 'true', updated_at = excluded.updated_at`
  ).run(SETUP_COMPLETE_KEY, now);
}

function resetAdmin({ databasePath, username, password }) {
  validateUsername(username);
  validatePassword(password);

  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const db = new Database(databasePath);
  try {
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    const existing = db.prepare("SELECT id, username FROM users LIMIT 1").get();

    if (existing) {
      db.prepare(
        `UPDATE users
         SET username = ?, password_hash = ?, updated_at = ?
         WHERE id = ?`
      ).run(username, passwordHash, now, existing.id);
      console.log(
        `Updated admin account "${existing.username}" -> "${username}" in ${databasePath}.`
      );
    } else {
      const userId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO users (id, username, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(userId, username, passwordHash, now, now);
      console.log(`Created admin account "${username}" in ${databasePath}.`);
    }

    upsertSetupComplete(db, now);
    console.log("Marked setup as complete.");
  } finally {
    db.close();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (!options.confirm) {
    console.error("Refusing to run without --confirm.");
    printHelp();
    process.exit(1);
  }

  if (!options.username) {
    console.error("Missing required --username.");
    process.exit(1);
  }

  const password = await resolvePassword(options);
  const databasePath =
    process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "unihomelabdash.sqlite");

  console.log("This will reset the admin account:");
  console.log(`  Database: ${databasePath}`);
  console.log(`  Username: ${options.username}`);
  console.log("  Password: [hidden]");

  resetAdmin({
    databasePath,
    username: options.username,
    password,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
