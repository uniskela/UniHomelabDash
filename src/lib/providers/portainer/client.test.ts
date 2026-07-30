import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { listPortainerEndpoints } from "./client";

test("listPortainerEndpoints rejects hung responses with a timeout", async () => {
  const previousTimeout = process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS;
  process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS = "50";

  const server = http.createServer((_request, _response) => {
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
