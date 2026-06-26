import assert from "node:assert/strict";
import test from "node:test";
import { dockerProviderHandler } from "./provider";
import type { ProviderContext } from "@/lib/providers/types";

function providerContext(config: Record<string, unknown>): ProviderContext {
  return {
    provider: {
      id: "docker",
      type: "docker",
      name: "Docker",
      enabled: true,
      readOnly: true,
      configJson: JSON.stringify(config),
      credentialsEncrypted: null,
      lastTestedAt: null,
      lastError: "",
      createdAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    },
    config,
    credentials: {},
  };
}

test("docker provider advertises read-only container logs capability", () => {
  assert.ok(dockerProviderHandler.meta.capabilities.includes("container.logs"));
});

test("docker provider getLogs rejects invalid Docker config", async () => {
  const result = await dockerProviderHandler.getLogs?.(
    providerContext({ mode: "tls", host: "docker.local" }),
    "abc123"
  );

  assert.deepEqual(result, {
    ok: false,
    logs: "",
    message: "TLS mode requires CA, client certificate, and client key.",
  });
});
