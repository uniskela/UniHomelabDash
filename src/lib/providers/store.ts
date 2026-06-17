import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { providers } from "@/lib/db/schema";
import type { ProviderType } from "@/lib/providers/types";

const DEFAULT_DOCKER_CONFIG = {
  socketPath: "/var/run/docker.sock",
};

export function upsertDockerProvider(input: {
  enabled: boolean;
  config?: Record<string, unknown>;
}) {
  const existing = getDb().select().from(providers).where(eq(providers.type, "docker")).get();
  const now = new Date().toISOString();
  const config = {
    ...DEFAULT_DOCKER_CONFIG,
    ...(input.config ?? {}),
  };

  if (existing) {
    getDb()
      .update(providers)
      .set({
        enabled: input.enabled,
        readOnly: true,
        configJson: JSON.stringify(config),
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
      name: "Docker",
      enabled: input.enabled,
      readOnly: true,
      configJson: JSON.stringify(config),
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return id;
}

export function getProviderByType(type: ProviderType) {
  return getDb().select().from(providers).where(eq(providers.type, type)).get();
}

export function isDockerProviderEnabled() {
  const row = getProviderByType("docker");
  return Boolean(row?.enabled);
}
