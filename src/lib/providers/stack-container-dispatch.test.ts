import assert from "node:assert/strict";
import test from "node:test";
import { dispatchStackContainerListing } from "./stack-container-dispatch";
import type { ProviderContext, ProviderHandler, ProviderRow } from "./types";

function providerRow(id: string, type: ProviderRow["type"], enabled = true): ProviderRow {
  return {
    id,
    type,
    name: id,
    enabled,
    readOnly: true,
    configJson: "{}",
    credentialsEncrypted: null,
    lastTestedAt: null,
    lastError: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function portainerHandler(calls: Array<{ providerId: string; stackId: string }>): ProviderHandler {
  return {
    meta: {
      type: "portainer",
      name: "Portainer",
      description: "test",
      capabilities: ["stack.containers"],
      supportsCredentials: true,
    },
    testConnection: async () => ({ ok: true, message: "ok" }),
    listResources: async () => ({ resources: [] }),
    listStackContainers: async (context, stackId) => {
      calls.push({ providerId: context.provider.id, stackId });
      return { kind: "ok", resources: [], cachedAt: 123 };
    },
  };
}

function dependencies(rows: ProviderRow[], handler: ProviderHandler) {
  return {
    getProviderRow: (id: string) => rows.find((row) => row.id === id),
    getHandler: () => handler,
    buildContext: (row: ProviderRow): ProviderContext => ({
      provider: row,
      config: {},
      credentials: {},
    }),
  };
}

test("dispatch scopes a stack container listing to its exact provider id", async () => {
  const calls: Array<{ providerId: string; stackId: string }> = [];
  const first = providerRow("provider-1", "portainer");
  const second = providerRow("provider-2", "portainer");
  const result = await dispatchStackContainerListing(
    "provider-1:42",
    { bypassCache: true },
    dependencies([first, second], portainerHandler(calls))
  );

  assert.deepEqual(result, { kind: "ok", resources: [], cachedAt: 123 });
  assert.deepEqual(calls, [{ providerId: "provider-1", stackId: "42" }]);
});

test("dispatch rejects malformed, missing, disabled, and non-Portainer providers", async () => {
  const calls: Array<{ providerId: string; stackId: string }> = [];
  const handler = portainerHandler(calls);
  const cases = [
    { resourceId: "bad-reference", rows: [] },
    { resourceId: "missing:42", rows: [] },
    { resourceId: "docker-1:42", rows: [providerRow("docker-1", "docker")] },
    { resourceId: "disabled:42", rows: [providerRow("disabled", "portainer", false)] },
  ];

  for (const item of cases) {
    const result = await dispatchStackContainerListing(
      item.resourceId,
      {},
      dependencies(item.rows, handler)
    );
    assert.deepEqual(result, { kind: "not_found", resources: [] });
  }

  assert.deepEqual(calls, []);
});

test("dispatch rejects handlers without stack container support", async () => {
  const row = providerRow("provider-1", "portainer");
  const handler: ProviderHandler = {
    meta: {
      type: "portainer",
      name: "Portainer",
      description: "test",
      capabilities: ["stack.list"],
      supportsCredentials: true,
    },
    testConnection: async () => ({ ok: true, message: "ok" }),
    listResources: async () => ({ resources: [] }),
  };

  const result = await dispatchStackContainerListing("provider-1:42", {}, dependencies([row], handler));

  assert.deepEqual(result, { kind: "not_found", resources: [] });
});
