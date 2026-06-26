import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { getDockerContainerLogs } from "./client";
import { parseDockerConfig } from "./config";

function withDockerServer(
  handler: http.RequestListener
): Promise<{ origin: { host: string; port: number }; close: () => Promise<void> }> {
  const server = http.createServer(handler);

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Expected TCP server address."));
        return;
      }

      resolve({
        origin: { host: "127.0.0.1", port: address.port },
        close: () =>
          new Promise((closeResolve, closeReject) => {
            server.close((error) => {
              if (error) closeReject(error);
              else closeResolve();
            });
          }),
      });
    });
  });
}

test("getDockerContainerLogs requests default stdout and stderr tail with timestamps", async () => {
  let requestedUrl = "";
  const server = await withDockerServer((request, response) => {
    requestedUrl = request.url ?? "";
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("2026-06-26T00:00:00Z app started\n");
  });

  try {
    const logs = await getDockerContainerLogs(
      parseDockerConfig({
        mode: "tcp",
        host: server.origin.host,
        port: server.origin.port,
      }),
      {},
      "container/name"
    );

    assert.equal(
      requestedUrl,
      "/containers/container%2Fname/logs?stdout=1&stderr=1&tail=200&timestamps=1"
    );
    assert.equal(logs, "2026-06-26T00:00:00Z app started\n");
  } finally {
    await server.close();
  }
});

test("getDockerContainerLogs returns empty log output", async () => {
  const server = await withDockerServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("");
  });

  try {
    const logs = await getDockerContainerLogs(
      parseDockerConfig({
        mode: "tcp",
        host: server.origin.host,
        port: server.origin.port,
      }),
      {},
      "abc123"
    );

    assert.equal(logs, "");
  } finally {
    await server.close();
  }
});

test("getDockerContainerLogs throws Docker error bodies", async () => {
  const server = await withDockerServer((_request, response) => {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("No such container");
  });

  try {
    await assert.rejects(
      getDockerContainerLogs(
        parseDockerConfig({
          mode: "tcp",
          host: server.origin.host,
          port: server.origin.port,
        }),
        {},
        "missing"
      ),
      /No such container/
    );
  } finally {
    await server.close();
  }
});
