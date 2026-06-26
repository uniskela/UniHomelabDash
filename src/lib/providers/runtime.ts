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
  ContainerLogsOptions,
  ContainerLogsResult,
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
  const rows = listEnabledProviderRows().filter((item) => item.type === providerType);
  if (rows.length === 0) {
    return { resources: [], error: "Provider is not configured or enabled." };
  }

  const handler = getProviderHandler(providerType);
  if (!handler) {
    return { resources: [], error: "Provider type is not supported." };
  }

  const resources: ProviderResource[] = [];
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const providerRow = toProviderRow(row);
      const providerResources = await handler.listResources(buildProviderContext(providerRow));
      resources.push(
        ...providerResources.map((resource) => ({
          ...resource,
          providerId: resource.providerId ?? providerRow.id,
          meta: {
            ...(resource.meta ?? {}),
            providerName: providerRow.name,
            providerReadOnly: String(providerRow.readOnly),
            ...providerHostMeta(providerRow.configJson),
          },
        }))
      );
    } catch (error) {
      const message = redactSecrets(
        error instanceof Error ? error.message : "Failed to load resources."
      );
      errors.push(`${row.name}: ${message}`);
    }
  }

  return {
    resources,
    error: resources.length === 0 && errors.length > 0 ? errors.join(" ") : undefined,
  };
}

export async function getProviderLogs(
  providerType: ProviderType,
  resourceId: string,
  options: ContainerLogsOptions = {},
  providerId?: string
): Promise<ContainerLogsResult> {
  const row = providerId
    ? getProviderRowById(providerId)
    : listEnabledProviderRows().find((item) => item.type === providerType);
  if (!row || row.type !== providerType || !row.enabled) {
    return { ok: false, logs: "", message: "Provider is not configured or enabled." };
  }

  const handler = getProviderHandler(providerType);
  if (!handler?.getLogs) {
    return { ok: false, logs: "", message: "This provider does not support logs." };
  }

  try {
    return await handler.getLogs(buildProviderContext(toProviderRow(row)), resourceId, options);
  } catch (error) {
    return {
      ok: false,
      logs: "",
      message: redactSecrets(error instanceof Error ? error.message : "Failed to load logs."),
    };
  }
}

export async function executeProviderAction(
  providerType: ProviderType,
  action: string,
  resourceId: string,
  providerId?: string
): Promise<{ ok: boolean; message: string }> {
  const row = providerId
    ? getProviderRowById(providerId)
    : listEnabledProviderRows().find((item) => item.type === providerType);
  if (!row || row.type !== providerType || !row.enabled) {
    return { ok: false, message: "Provider is not configured or enabled." };
  }

  const handler = getProviderHandler(providerType);
  if (!handler?.executeAction) {
    return { ok: false, message: "This provider does not support actions." };
  }

  try {
    return await handler.executeAction(buildProviderContext(toProviderRow(row)), action, resourceId);
  } catch (error) {
    return {
      ok: false,
      message: redactSecrets(error instanceof Error ? error.message : "Action failed."),
    };
  }
}

function providerHostMeta(configJson: string): Record<string, string> {
  try {
    const config = JSON.parse(configJson) as { mode?: unknown; host?: unknown };
    if ((config.mode === "tcp" || config.mode === "tls") && typeof config.host === "string") {
      return { providerHost: config.host };
    }
  } catch {
    return {};
  }

  return {};
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
