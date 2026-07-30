import assert from "node:assert/strict";
import test from "node:test";
import { isPortainerDockerEndpoint, portainerProviderHandler } from "./provider";
import type { ProviderContext } from "@/lib/providers/types";

function providerContext(config: Record<string, unknown>): ProviderContext {
  return {
    provider: {
      id: "portainer-1",
      type: "portainer",
      name: "Portainer",
      enabled: true,
      readOnly: true,
      configJson: JSON.stringify(config),
      credentialsEncrypted: null,
      lastTestedAt: null,
      lastError: "",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
    config,
    credentials: { portainerApiKey: "token" },
  };
}

test("portainer provider advertises read-only capabilities", () => {
  assert.deepEqual(portainerProviderHandler.meta.capabilities, [
    "container.list",
    "container.status",
    "container.logs",
  ]);
});

test("portainer provider getLogs rejects malformed resource ids", async () => {
  const result = await portainerProviderHandler.getLogs?.(
    providerContext({ baseUrl: "https://portainer.local" }),
    "invalid-id"
  );

  assert.deepEqual(result, {
    ok: false,
    logs: "",
    message: "Invalid Portainer container reference.",
  });
});

test("isPortainerDockerEndpoint includes Edge Agent Docker and excludes Kubernetes", () => {
  assert.equal(isPortainerDockerEndpoint(1), true);
  assert.equal(isPortainerDockerEndpoint(2), true);
  assert.equal(isPortainerDockerEndpoint(4), true);
  assert.equal(isPortainerDockerEndpoint(undefined), true);
  assert.equal(isPortainerDockerEndpoint(3), false);
  assert.equal(isPortainerDockerEndpoint(5), false);
  assert.equal(isPortainerDockerEndpoint(6), false);
  assert.equal(isPortainerDockerEndpoint(7), false);
});
