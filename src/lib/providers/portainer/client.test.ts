import assert from "node:assert/strict";
import http from "node:http";
import type { RequestOptions as HttpsRequestOptions } from "node:https";
import test from "node:test";
import {
  buildPortainerRequestOptions,
  getPortainerListTimeoutMs,
  joinPortainerPath,
  listPortainerEndpointContainers,
  listPortainerEndpoints,
  listPortainerStacks,
  unbracketHostname,
} from "./client";

function requestOptions(baseUrl: string, path = "/api/endpoints") {
  return buildPortainerRequestOptions({
    config: { baseUrl },
    credentials: { apiKey: "token" },
    path,
  });
}

test("joinPortainerPath preserves reverse-proxy prefixes", () => {
  assert.equal(joinPortainerPath("/portainer", "/api/endpoints"), "/portainer/api/endpoints");
  assert.equal(joinPortainerPath("/portainer/", "/api/endpoints"), "/portainer/api/endpoints");
  assert.equal(joinPortainerPath("/", "/api/endpoints"), "/api/endpoints");
});

test("unbracketHostname strips IPv6 brackets only", () => {
  assert.equal(unbracketHostname("[fd00::10]"), "fd00::10");
  assert.equal(unbracketHostname("portainer.local"), "portainer.local");
});

test("buildPortainerRequestOptions keeps base path prefixes", () => {
  const options = requestOptions("https://host.local/portainer");
  assert.equal(options.path, "/portainer/api/endpoints");
  assert.equal(options.port, 443);
});

test("buildPortainerRequestOptions resolves IPv6 hosts without brackets", () => {
  const options = requestOptions("https://[fd00::10]:9443");
  const headers = options.headers as Record<string, string> | undefined;

  assert.equal(options.hostname, "fd00::10");
  assert.equal(options.port, 9443);
  assert.equal(headers?.Host, "[fd00::10]:9443");
});

test("buildPortainerRequestOptions normalizes uppercase schemes to TLS", () => {
  const options = requestOptions("HTTPS://portainer.local");

  assert.equal(options.protocol, "https:");
  assert.equal(options.port, 443);
});

test("buildPortainerRequestOptions includes a custom CA and API key", () => {
  const options = buildPortainerRequestOptions({
    config: { baseUrl: "https://portainer.local" },
    credentials: { apiKey: "test-token", caCert: "test-ca" },
    path: "/api/stacks",
  });
  const headers = options.headers as Record<string, string> | undefined;

  assert.equal((options as HttpsRequestOptions).ca, "test-ca");
  assert.equal(headers?.["X-API-Key"], "test-token");
});

test("listPortainerEndpoints requests the prefixed API path", async () => {
  let requestedUrl = "";
  const server = http.createServer((request, response) => {
    requestedUrl = request.url ?? "";
    response.writeHead(200, { "content-type": "application/json" });
    response.end("[]");
  });

  await new Promise<void>((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const endpoints = await listPortainerEndpoints(
      { baseUrl: `HTTP://127.0.0.1:${address.port}/portainer` },
      { apiKey: "token" }
    );

    assert.deepEqual(endpoints, []);
    assert.equal(requestedUrl, "/portainer/api/endpoints");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("listPortainerEndpoints rejects hung responses with a timeout", async () => {
  const previousTimeout = process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS;
  process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS = "50";

  const server = http.createServer(() => {
    // Intentionally never respond.
  });

  await new Promise<void>((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    await assert.rejects(
      listPortainerEndpoints(
        { baseUrl: `http://127.0.0.1:${address.port}` },
        { apiKey: "token" }
      ),
      /timed out/i
    );
  } finally {
    if (previousTimeout === undefined) {
      delete process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS;
    } else {
      process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS = previousTimeout;
    }
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("listPortainerEndpointContainers uses the shorter list timeout", async () => {
  const previousListTimeout = process.env.UH_PORTAINER_LIST_TIMEOUT_MS;
  const previousRequestTimeout = process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS;
  process.env.UH_PORTAINER_LIST_TIMEOUT_MS = "50";
  process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS = "5000";

  assert.equal(getPortainerListTimeoutMs(), 50);

  const server = http.createServer(() => {
    // Intentionally never respond.
  });

  await new Promise<void>((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    await assert.rejects(
      listPortainerEndpointContainers(
        { baseUrl: `http://127.0.0.1:${address.port}` },
        { apiKey: "token" },
        1
      ),
      /timed out/i
    );
  } finally {
    if (previousListTimeout === undefined) {
      delete process.env.UH_PORTAINER_LIST_TIMEOUT_MS;
    } else {
      process.env.UH_PORTAINER_LIST_TIMEOUT_MS = previousListTimeout;
    }
    if (previousRequestTimeout === undefined) {
      delete process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS;
    } else {
      process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS = previousRequestTimeout;
    }
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("listPortainerStacks requests the prefixed API path with authentication", async () => {
  let requestedUrl = "";
  let apiKey = "";
  const server = http.createServer((request, response) => {
    requestedUrl = request.url ?? "";
    apiKey = String(request.headers["x-api-key"] ?? "");
    response.writeHead(200, { "content-type": "application/json" });
    response.end('[{"Id":42,"Name":"media","Type":2,"EndpointId":7,"Status":1}]');
  });

  await new Promise<void>((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const stacks = await listPortainerStacks(
      { baseUrl: `http://127.0.0.1:${address.port}/portainer` },
      { apiKey: "test-token" }
    );

    assert.equal(requestedUrl, "/portainer/api/stacks");
    assert.equal(apiKey, "test-token");
    assert.equal(stacks[0]?.Name, "media");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("listPortainerStacks rejects malformed and error responses", async () => {
  let mode: "malformed" | "error" = "malformed";
  const server = http.createServer((_request, response) => {
    if (mode === "error") {
      response.writeHead(403, { "content-type": "text/plain" });
      response.end("permission denied");
      return;
    }
    response.writeHead(200, { "content-type": "application/json" });
    response.end('{"not":"an array"}');
  });

  await new Promise<void>((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const config = { baseUrl: `http://127.0.0.1:${address.port}` };
  const credentials = { apiKey: "test-token" };

  try {
    await assert.rejects(listPortainerStacks(config, credentials), /invalid stack list/i);
    mode = "error";
    await assert.rejects(listPortainerStacks(config, credentials), /permission denied/i);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("listPortainerStacks rejects hung responses with the request timeout", async () => {
  const previousTimeout = process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS;
  process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS = "50";
  const server = http.createServer(() => {
    // Intentionally never respond.
  });

  await new Promise<void>((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    await assert.rejects(
      listPortainerStacks(
        { baseUrl: `http://127.0.0.1:${address.port}` },
        { apiKey: "test-token" }
      ),
      /timed out/i
    );
  } finally {
    if (previousTimeout === undefined) {
      delete process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS;
    } else {
      process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS = previousTimeout;
    }
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
