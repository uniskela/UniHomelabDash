import { redactSecrets } from "@/lib/providers/credentials";
import {
  buildProviderContext,
  getProviderHandler,
  getProviderRowById,
  listEnabledProviderRows,
  toProviderRow,
} from "@/lib/providers/registry";
import type {
  ConnectionTestResult,
  ProviderPublicView,
  ProviderResource,
  ProviderType,
} from "@/lib/providers/types";

export async function listConfiguredProviders(): Promise<ProviderPublicView[]> {
  const { listProviderRows, rowToPublicView } = await import("@/lib/providers/registry");
  return listProviderRows().map((row) => rowToPublicView(toProviderRow(row)));
}

export async function testProviderConnection(providerId: string): Promise<ConnectionTestResult> {
  const row = getProviderRowById(providerId);
  if (!row) {
    return { ok: false, message: "Provider not found." };
  }

  const handler = getProviderHandler(row.type as ProviderType);
  if (!handler) {
    return { ok: false, message: "Provider type is not supported." };
  }

  try {
    const result = await handler.testConnection(buildProviderContext(toProviderRow(row)));
    await updateProviderTestState(providerId, result);
    return result;
  } catch (error) {
    const message = redactSecrets(
      error instanceof Error ? error.message : "Connection test failed."
    );
    await updateProviderTestState(providerId, { ok: false, message });
    return { ok: false, message };
  }
}

export async function listProviderResources(
  providerType: ProviderType
): Promise<{ resources: ProviderResource[]; error?: string }> {
  const row = listEnabledProviderRows().find((item) => item.type === providerType);
  if (!row) {
    return { resources: [], error: "Provider is not configured or enabled." };
  }

  const handler = getProviderHandler(providerType);
  if (!handler) {
    return { resources: [], error: "Provider type is not supported." };
  }

  try {
    const resources = await handler.listResources(buildProviderContext(toProviderRow(row)));
    return { resources };
  } catch (error) {
    return {
      resources: [],
      error: redactSecrets(error instanceof Error ? error.message : "Failed to load resources."),
    };
  }
}

async function updateProviderTestState(
  providerId: string,
  result: ConnectionTestResult
) {
  const { getDb } = await import("@/lib/db/client");
  const { providers } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  getDb()
    .update(providers)
    .set({
      lastTestedAt: new Date().toISOString(),
      lastError: result.ok ? "" : result.message,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(providers.id, providerId))
    .run();
}
