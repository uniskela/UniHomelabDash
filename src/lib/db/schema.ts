import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const healthStatuses = ["healthy", "degraded", "unknown"] as const;

export const services = sqliteTable("services", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull().default("General"),
  host: text("host").notNull().default(""),
  icon: text("icon").notNull().default(""),
  notes: text("notes").notNull().default(""),
  healthUrl: text("health_url").notNull().default(""),
  healthStatus: text("health_status", { enum: healthStatuses }).notNull().default("unknown"),
  healthErrorMessage: text("health_error_message").notNull().default(""),
  lastCheckedAt: text("last_checked_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const providerTypes = ["manual", "docker", "portainer"] as const;

export const providers = sqliteTable("providers", {
  id: text("id").primaryKey(),
  type: text("type", { enum: providerTypes }).notNull(),
  name: text("name").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  readOnly: integer("read_only", { mode: "boolean" }).notNull().default(true),
  configJson: text("config_json").notNull().default("{}"),
  credentialsEncrypted: text("credentials_encrypted"),
  lastTestedAt: text("last_tested_at"),
  lastError: text("last_error").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
