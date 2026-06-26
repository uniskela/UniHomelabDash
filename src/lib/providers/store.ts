import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { providers } from "@/lib/db/schema";
import { encryptCredentials } from "@/lib/providers/credentials";
import type { DockerConnectionMode } from "@/lib/providers/docker/config";
import type { ProviderType } from "@/lib/providers/types";

const DEFAULT_DOCKER_CONFIG = {
  mode: "local" as DockerConnectionMode,
  socketPath: "/var/run/docker.sock",
  host: "127.0.0.1",
  port: 2375,
};

export function upsertDockerProvider(input: {
  id?: string;
  name?: string;
  enabled: boolean;
  readOnly?: boolean;
  config?: Record<string, unknown>;
  credentials?: Record<string, string>;
  preserveCredentials?: boolean;
}) {
  const existing = input.id
    ? getDb().select().from(providers).where(eq(providers.id, input.id)).get()
    : undefined;
  const now = new Date().toISOString();
  const config = {
    ...DEFAULT_DOCKER_CONFIG,
    ...(input.config ?? {}),
  };

  let credentialsEncrypted = existing?.credentialsEncrypted ?? null;
  if (input.credentials && Object.keys(input.credentials).length > 0) {
    credentialsEncrypted = encryptCredentials(input.credentials);
  } else if (input.preserveCredentials === false) {
    credentialsEncrypted = null;
  }

  const readOnly = input.readOnly ?? existing?.readOnly ?? true;
  const name = limitName(input.name) || existing?.name || "Docker";

  if (existing) {
    getDb()
      .update(providers)
      .set({
        name,
        enabled: input.enabled,
        readOnly,
        configJson: JSON.stringify(config),
        credentialsEncrypted,
        updatedAt: now,
      })
      .where(eq(providers.id, existing.id))
      .run();

    return existing.id;
  }

  const id = crypto.randomUUID();
  getDb()
    .insert(providers)
    .values({
      id,
      type: "docker",
      name,
      enabled: input.enabled,
      readOnly,
      configJson: JSON.stringify(config),
      credentialsEncrypted,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return id;
}

export function createDockerProvider(name = "Docker") {
  return upsertDockerProvider({
    name,
    enabled: false,
    readOnly: true,
    config: DEFAULT_DOCKER_CONFIG,
  });
}

export function deleteProviderById(id: string) {
  getDb().delete(providers).where(eq(providers.id, id)).run();
}

export function listProvidersByType(type: ProviderType) {
  return getDb()
    .select()
    .from(providers)
    .where(eq(providers.type, type))
    .orderBy(desc(providers.updatedAt))
    .all();
}

export function getProviderByType(type: ProviderType) {
  return getDb().select().from(providers).where(eq(providers.type, type)).get();
}

export function isDockerProviderEnabled() {
  return listProvidersByType("docker").some((row) => row.enabled);
}

export function isDockerActionsEnabled() {
  return listProvidersByType("docker").some((row) => row.enabled && !row.readOnly);
}

function limitName(value: string | undefined) {
  return value?.trim().slice(0, 80) ?? "";
}
