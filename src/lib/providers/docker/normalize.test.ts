import assert from "node:assert/strict";
import test from "node:test";
import {
  formatContainerPorts,
  normalizeContainerName,
  normalizeContainerState,
  normalizeDockerListItem,
} from "./normalize";

test("normalizeContainerName strips leading slash", () => {
  assert.equal(normalizeContainerName(["/nginx"]), "nginx");
  assert.equal(normalizeContainerName([]), "unknown");
});

test("normalizeContainerState maps docker states", () => {
  assert.equal(normalizeContainerState("running"), "running");
  assert.equal(normalizeContainerState("exited"), "exited");
  assert.equal(normalizeContainerState("weird"), "unknown");
});

test("formatContainerPorts handles list and map formats", () => {
  assert.deepEqual(
    formatContainerPorts([
      { PrivatePort: 80, PublicPort: 8080, Type: "tcp" },
      { PrivatePort: 443, Type: "tcp" },
    ]),
    ["8080:80/tcp", "443/tcp"]
  );

  assert.deepEqual(
    formatContainerPorts({
      "80/tcp": [{ HostIp: "0.0.0.0", HostPort: "8080" }],
    }),
    ["0.0.0.0:8080->80/tcp"]
  );
});

test("normalizeDockerListItem maps docker list payload", () => {
  const result = normalizeDockerListItem({
    Id: "abc123",
    Names: ["/web"],
    Image: "nginx:latest",
    State: "running",
    Status: "Up 2 hours",
    Created: 1_700_000_000,
    Labels: { app: "web" },
    Ports: [{ PrivatePort: 80, PublicPort: 8080, Type: "tcp" }],
  });

  assert.equal(result.id, "abc123");
  assert.equal(result.name, "web");
  assert.equal(result.state, "running");
  assert.deepEqual(result.ports, ["8080:80/tcp"]);
});
