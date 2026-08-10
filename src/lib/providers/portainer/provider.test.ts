import assert from "node:assert/strict";
import http from "node:http";
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
    "stack.list",
    "stack.status",
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

test("portainer provider lists stacks only for Docker endpoints", async () => {
  const server = http.createServer((request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    if (request.url === "/api/endpoints") {
      response.end(
        JSON.stringify([
          { Id: 7, Name: "Docker host", Type: 1 },
          { Id: 9, Name: "Kubernetes", Type: 5 },
        ])
      );
      return;
    }
    if (request.url === "/api/stacks") {
      response.end(
        JSON.stringify([
          { Id: 42, Name: "media", Type: 2, EndpointId: 7, Status: 1 },
          { Id: 43, Name: "cluster", Type: 3, EndpointId: 9, Status: 1 },
        ])
      );
      return;
    }
    response.writeHead(404);
    response.end();
  });

  await new Promise<void>((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const result = await portainerProviderHandler.listStacks?.(
      providerContext({ baseUrl: `http://127.0.0.1:${address.port}` })
    );

    assert.ok(result);
    assert.equal(result.resources.length, 1);
    assert.equal(result.resources[0]?.name, "media");
    assert.equal(result.resources[0]?.endpointName, "Docker host");
    assert.equal(result.resources[0]?.providerName, "Portainer");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
