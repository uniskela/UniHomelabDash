import assert from "node:assert/strict";
import test from "node:test";
import { buildContainerServiceDefaults } from "./dashboard-prefill";
import type { ProviderResource } from "@/lib/providers/types";

function container(overrides: Partial<ProviderResource> = {}): ProviderResource {
  return {
    id: "abc123",
    kind: "container",
    name: "jellyfin",
    status: "running",
    summary: "Up 2 hours",
    image: "lscr.io/linuxserver/jellyfin:latest",
    ports: [],
    labels: {},
    providerType: "docker",
    providerId: "docker-1",
    meta: {},
    ...overrides,
  };
}

test("container service defaults ignore OCI image package URLs", () => {
  const defaults = buildContainerServiceDefaults(
    container({
      labels: {
        "org.opencontainers.image.url": "https://github.com/linuxserver/docker-jellyfin/packages",
      },
    })
  );

  assert.equal(defaults.healthUrl, "");
  assert.doesNotMatch(defaults.notes, /github\.com\/linuxserver\/docker-jellyfin\/packages/);
});

test("container service defaults use explicit health labels", () => {
  const defaults = buildContainerServiceDefaults(
    container({
      labels: {
        "unihomelabdash.health-url": "https://jellyfin.example.local/health",
        "org.opencontainers.image.url": "https://github.com/linuxserver/docker-jellyfin/packages",
      },
    })
  );

  assert.equal(defaults.healthUrl, "https://jellyfin.example.local/health");
  assert.match(defaults.notes, /Detected health URL: https:\/\/jellyfin\.example\.local\/health/);
});

test("container service defaults infer health URL from Docker host and published port", () => {
  const defaults = buildContainerServiceDefaults(
    container({
      ports: ["8096:8096/tcp"],
      meta: { providerHost: "192.168.0.20" },
    })
  );

  assert.equal(defaults.healthUrl, "http://192.168.0.20:8096");
});

test("container service defaults leave health URL blank without a reachable host", () => {
  const defaults = buildContainerServiceDefaults(
    container({
      ports: ["8096:8096/tcp"],
    })
  );

  assert.equal(defaults.healthUrl, "");
});
