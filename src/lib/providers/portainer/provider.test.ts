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
    "stack.containers",
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
  assert.equal(isPortainerDockerEndpoint(undefined), false);
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
          { Id: 7, Name: "Docker host", Type: 1, Status: 1 },
          { Id: 8, Name: "Nextcloud", Type: 2, Status: 2 },
          { Id: 9, Name: "Kubernetes", Type: 5, Status: 1 },
        ])
      );
      return;
    }
    if (request.url === "/api/stacks") {
      response.end(
        JSON.stringify([
          { Id: 42, Name: "media", Type: 2, EndpointId: 7, Status: 1 },
          { Id: 43, Name: "nextcloud", Type: 2, EndpointId: 8, Status: 1 },
          { Id: 44, Name: "cluster", Type: 3, EndpointId: 9, Status: 1 },
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
    assert.equal(result.resources.length, 2);
    assert.equal(result.resources[0]?.name, "media");
    assert.equal(result.resources[0]?.endpointName, "Docker host");
    assert.equal(result.resources[0]?.providerName, "Portainer");
    assert.equal(result.resources[1]?.name, "nextcloud");
    assert.equal(result.resources[1]?.status, "unavailable");
    assert.equal(result.resources[1]?.reportedStatus, "active");
    assert.equal(result.resources[1]?.endpointStatus, "disconnected");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("portainer provider resolves only exact containers for connected stacks", async () => {
  const requestedPaths: string[] = [];
  const server = http.createServer((request, response) => {
    requestedPaths.push(request.url ?? "");
    response.writeHead(200, { "content-type": "application/json" });

    if (request.url === "/api/endpoints") {
      response.end(
        JSON.stringify([
          { Id: 7, Name: "Docker host", Type: 1, Status: 1 },
          { Id: 8, Name: "Disconnected", Type: 1, Status: 2 },
        ])
      );
      return;
    }
    if (request.url === "/api/stacks") {
      response.end(
        JSON.stringify([
          { Id: 42, Name: "nextcloud-aio", Type: 2, EndpointId: 7, Status: 1 },
          { Id: 43, Name: "nextcloud-aio", Type: 2, EndpointId: 8, Status: 1 },
        ])
      );
      return;
    }
    if (request.url === "/api/endpoints/7/docker/containers/json?all=1") {
      response.end(
        JSON.stringify([
          {
            Id: "member",
            Names: ["/nextcloud"],
            Image: "nextcloud:latest",
            State: "running",
            Status: "Up 1 hour",
            Labels: { "com.docker.compose.project": "nextcloud-aio" },
            Env: ["SECRET=value"],
          },
          {
            Id: "non-member",
            Names: ["/old-nextcloud"],
            Image: "nextcloud:old",
            State: "running",
            Status: "Up 1 hour",
            Labels: { "com.docker.compose.project": "nextcloud-aio-old" },
          },
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
    const context = providerContext({ baseUrl: `http://127.0.0.1:${address.port}` });
    const connected = await portainerProviderHandler.listStackContainers?.(context, "42");

    assert.ok(connected && connected.kind === "ok");
    assert.deepEqual(connected, {
      kind: "ok",
      resources: [
        {
          id: "7:member",
          name: "nextcloud",
          state: "running",
          status: "Up 1 hour",
          image: "nextcloud:latest",
          ports: [],
          providerId: "portainer-1",
          providerName: "Portainer",
          endpointId: 7,
          endpointName: "Docker host",
        },
      ],
    });
    assert.equal("labels" in connected.resources[0]!, false);
    assert.equal("Env" in connected.resources[0]!, false);

    const cached = await portainerProviderHandler.listStackContainers?.(context, "42");
    assert.ok(cached && cached.kind === "ok");
    assert.equal(typeof cached.cachedAt, "number");
    assert.equal(
      requestedPaths.filter((path) => path === "/api/endpoints/7/docker/containers/json?all=1").length,
      1
    );

    const disconnected = await portainerProviderHandler.listStackContainers?.(context, "43");
    assert.deepEqual(disconnected, {
      kind: "unavailable",
      reason: "endpoint_disconnected",
      resources: [],
    });
    assert.equal(
      requestedPaths.includes("/api/endpoints/8/docker/containers/json?all=1"),
      false
    );

    const missing = await portainerProviderHandler.listStackContainers?.(context, "999");
    assert.deepEqual(missing, { kind: "not_found", resources: [] });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

async function withMutableStackMembershipServer(
  run: (fixture: {
    context: ProviderContext;
    requestedPaths: string[];
    setContainerImage: (image: string) => void;
    setEndpointStatus: (status: number) => void;
  }) => Promise<void>
) {
  const requestedPaths: string[] = [];
  let containerImage = "nextcloud:cached";
  let endpointStatus = 1;
  const server = http.createServer((request, response) => {
    requestedPaths.push(request.url ?? "");
    response.writeHead(200, { "content-type": "application/json" });

    if (request.url === "/api/endpoints") {
      response.end(JSON.stringify([{ Id: 7, Name: "Docker host", Type: 1, Status: endpointStatus }]));
      return;
    }
    if (request.url === "/api/stacks") {
      response.end(
        JSON.stringify([
          { Id: 52, Name: "nextcloud-aio", Type: 2, EndpointId: 7, Status: 1 },
        ])
      );
      return;
    }
    if (request.url === "/api/endpoints/7/docker/containers/json?all=1") {
      response.end(
        JSON.stringify([
          {
            Id: "member",
            Names: ["/nextcloud"],
            Image: containerImage,
            State: "running",
            Status: "Up 1 hour",
            Labels: { "com.docker.compose.project": "nextcloud-aio" },
          },
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
    await run({
      context: providerContext({ baseUrl: `http://127.0.0.1:${address.port}` }),
      requestedPaths,
      setContainerImage: (image) => { containerImage = image; },
      setEndpointStatus: (status) => { endpointStatus = status; },
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("portainer provider bypasses successful membership cache on refresh", async () => {
  await withMutableStackMembershipServer(async ({
    context,
    requestedPaths,
    setContainerImage,
  }) => {
    const initial = await portainerProviderHandler.listStackContainers?.(context, "52");
    assert.ok(initial && initial.kind === "ok");
    assert.equal(initial.resources[0]?.image, "nextcloud:cached");

    setContainerImage("nextcloud:refreshed");
    const refreshed = await portainerProviderHandler.listStackContainers?.(context, "52", {
      bypassCache: true,
    });

    assert.ok(refreshed && refreshed.kind === "ok");
    assert.equal(refreshed.resources[0]?.image, "nextcloud:refreshed");
    assert.equal(
      requestedPaths.filter((path) => path === "/api/endpoints/7/docker/containers/json?all=1").length,
      2
    );
  });
});

test("portainer provider checks endpoint connectivity before returning cached membership", async () => {
  await withMutableStackMembershipServer(async ({ context, requestedPaths, setEndpointStatus }) => {
    const initial = await portainerProviderHandler.listStackContainers?.(context, "52", {
      bypassCache: true,
    });
    assert.ok(initial && initial.kind === "ok");

    setEndpointStatus(2);
    const disconnected = await portainerProviderHandler.listStackContainers?.(context, "52");

    assert.deepEqual(disconnected, {
      kind: "unavailable",
      reason: "endpoint_disconnected",
      resources: [],
    });
    assert.equal(
      requestedPaths.filter((path) => path === "/api/endpoints/7/docker/containers/json?all=1").length,
      1
    );
  });
});
