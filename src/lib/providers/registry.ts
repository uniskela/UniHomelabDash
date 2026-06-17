import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { providers } from "@/lib/db/schema";
import { decryptCredentials } from "@/lib/providers/credentials";
import { dockerProviderHandler } from "@/lib/providers/docker/provider";
import { manualProviderHandler } from "@/lib/providers/manual/provider";
import type {
  ProviderContext,
  ProviderHandler,
  ProviderPublicView,
  ProviderRow,
  ProviderType,
} from "@/lib/providers/types";

const handlers: Record<ProviderType, ProviderHandler | undefined> = {
  manual: manualProviderHandler,
  docker: dockerProviderHandler,
  portainer: undefined,
};

export function getProviderHandler(type: ProviderType): ProviderHandler | null {
  return handlers[type] ?? null;
}

export function listProviderDefinitions() {
  return Object.values(handlers)
    .filter((handler): handler is ProviderHandler => Boolean(handler))
    .map((handler) => handler.meta);
}

export function rowToPublicView(row: ProviderRow): ProviderPublicView {
  const handler = getProviderHandler(row.type);
  if (!handler) {
    throw new Error(`Unsupported provider type: ${row.type}`);
  }

  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(row.configJson) as Record<string, unknown>;
  } catch {
    config = {};
  }

  return {
    id: row.id,
    type: row.type,
    name: row.name,
    enabled: row.enabled,
    readOnly: row.readOnly,
    config,
    lastTestedAt: row.lastTestedAt,
    lastError: row.lastError,
    definition: handler.meta,
  };
}

export function buildProviderContext(row: ProviderRow): ProviderContext {
  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(row.configJson) as Record<string, unknown>;
  } catch {
    config = {};
  }

  let credentials: Record<string, string> = {};
  if (row.credentialsEncrypted) {
    try {
      credentials = decryptCredentials(row.credentialsEncrypted);
    } catch {
      credentials = {};
    }
  }

  return { provider: row, config, credentials };
}

export function listProviderRows() {
  return getDb().select().from(providers).orderBy(desc(providers.updatedAt)).all();
}

export function getProviderRowById(id: string) {
  return getDb().select().from(providers).where(eq(providers.id, id)).get();
}

export function getProviderRowByType(type: ProviderType) {
  return getDb().select().from(providers).where(eq(providers.type, type)).get();
}

export function listEnabledProviderRows() {
  return getDb()
    .select()
    .from(providers)
    .where(eq(providers.enabled, true))
    .orderBy(desc(providers.updatedAt))
    .all();
}

export function toProviderRow(row: typeof providers.$inferSelect): ProviderRow {
  return {
    id: row.id,
    type: row.type as ProviderType,
    name: row.name,
    enabled: row.enabled,
    readOnly: row.readOnly,
    configJson: row.configJson,
    credentialsEncrypted: row.credentialsEncrypted,
    lastTestedAt: row.lastTestedAt,
    lastError: row.lastError,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
