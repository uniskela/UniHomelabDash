import assert from "node:assert/strict";
import test from "node:test";
import { matchesContainerQuery, parseContainerQuery } from "./container-query";
import type { ProviderResource } from "@/lib/providers/types";

function container(overrides: Partial<ProviderResource> = {}): ProviderResource {
  return {
    id: "abc123",
    kind: "container",
    name: "immich_server",
    status: "running",
    summary: "Up 3 days",
    image: "ghcr.io/immich-app/immich-server:release",
    ports: ["0.0.0.0:2283->2283/tcp"],
    labels: { "com.docker.compose.project": "immich" },
    providerType: "portainer",
    meta: {
      providerName: "Portainer",
      endpointName: "nas (local)",
    },
    ...overrides,
  };
}

function matches(query: string, resource = container()) {
  return matchesContainerQuery(resource, parseContainerQuery(query));
}

test("parseContainerQuery maps prefixes, aliases, and negation", () => {
  assert.deepEqual(parseContainerQuery("host:nas -name:test redis"), [
    { field: "host", value: "nas", negated: false },
    { field: "name", value: "test", negated: true },
    { field: "text", value: "redis", negated: false },
  ]);

  assert.deepEqual(parseContainerQuery("s:running img:nginx"), [
    { field: "status", value: "running", negated: false },
    { field: "image", value: "nginx", negated: false },
  ]);
});

test("parseContainerQuery keeps quoted values and ignores empty terms", () => {
  assert.deepEqual(parseContainerQuery('name:"media server" host:'), [
    { field: "name", value: "media server", negated: false },
  ]);

  assert.deepEqual(parseContainerQuery("   "), []);
});

test("parseContainerQuery treats unknown prefixes as free text", () => {
  assert.deepEqual(parseContainerQuery("registry:ghcr.io"), [
    { field: "text", value: "registry:ghcr.io", negated: false },
  ]);
});

test("matchesContainerQuery targets the requested field", () => {
  assert.equal(matches("name:immich"), true);
  assert.equal(matches("name:nginx"), false);
  assert.equal(matches("image:immich-server"), true);
  assert.equal(matches("host:nas"), true);
  assert.equal(matches("host:nextcloud"), false);
  assert.equal(matches("port:2283"), true);
  assert.equal(matches("id:abc"), true);
  assert.equal(matches("label:compose.project=immich"), true);
  assert.equal(matches("provider:portainer"), true);
});

test("matchesContainerQuery understands running and stopped status shortcuts", () => {
  assert.equal(matches("status:running"), true);
  assert.equal(matches("status:stopped"), false);
  assert.equal(matches("status:stopped", container({ status: "exited" })), true);
  assert.equal(matches("status:up"), true);
});

test("matchesContainerQuery combines terms and honours negation", () => {
  assert.equal(matches("host:nas status:running immich"), true);
  assert.equal(matches("host:nas status:running -image:nginx"), true);
  assert.equal(matches("host:nas -status:running"), false);
});

test("matchesContainerQuery falls back to a broad search for bare terms", () => {
  assert.equal(matches("2283"), true);
  assert.equal(matches("ghcr.io"), true);
  assert.equal(matches("nowhere"), false);
  assert.equal(matches("immich 2283"), true, "bare terms are combined with AND");
  assert.equal(matches("immich nginx"), false);
});
