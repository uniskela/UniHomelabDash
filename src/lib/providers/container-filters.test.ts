import assert from "node:assert/strict";
import test from "node:test";
import {
  containerHostLabel,
  filterContainers,
  listContainerHostOptions,
} from "./container-filters";
import type { ProviderResource } from "@/lib/providers/types";

function container(overrides: Partial<ProviderResource> = {}): ProviderResource {
  return {
    id: "abc",
    kind: "container",
    name: "nginx",
    status: "running",
    image: "nginx:latest",
    providerType: "portainer",
    meta: {
      providerName: "Portainer",
      endpointName: "immich (local)",
    },
    ...overrides,
  };
}

test("containerHostLabel prefers endpoint name then provider host", () => {
  assert.equal(containerHostLabel(container()), "immich (local)");
  assert.equal(
    containerHostLabel(
      container({
        meta: { providerName: "Docker", providerHost: "192.168.0.20" },
      })
    ),
    "192.168.0.20"
  );
});

test("filterContainers matches host, status, and search", () => {
  const items = [
    container({ id: "1", name: "immich_server", status: "running" }),
    container({
      id: "2",
      name: "postgres",
      status: "exited",
      meta: { providerName: "Portainer", endpointName: "nextcloud" },
    }),
    container({
      id: "3",
      name: "redis",
      status: "running",
      image: "redis:7",
      meta: { providerName: "Portainer", endpointName: "immich (local)" },
    }),
  ];

  assert.deepEqual(listContainerHostOptions(items), ["immich (local)", "nextcloud"]);
  assert.equal(filterContainers(items, { host: "nextcloud" }).length, 1);
  assert.equal(filterContainers(items, { status: "stopped" }).length, 1);
  assert.equal(filterContainers(items, { search: "redis:7" })[0]?.name, "redis");
  assert.equal(
    filterContainers(items, {
      host: "immich (local)",
      status: "running",
      search: "immich_server",
    }).length,
    1
  );
});
