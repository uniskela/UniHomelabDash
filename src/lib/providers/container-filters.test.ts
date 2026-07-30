import assert from "node:assert/strict";
import test from "node:test";
import {
  containerHideKey,
  containerHostLabel,
  filterContainers,
  groupContainers,
  listContainerHostOptions,
  splitHiddenContainers,
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

test("filterContainers accepts prefixed search terms", () => {
  const items = [
    container({ id: "1", name: "immich_server" }),
    container({
      id: "2",
      name: "redis",
      image: "redis:7",
      meta: { providerName: "Portainer", endpointName: "nextcloud" },
    }),
  ];

  assert.equal(filterContainers(items, { search: "host:nextcloud" })[0]?.name, "redis");
  assert.equal(filterContainers(items, { search: "-host:nextcloud" })[0]?.name, "immich_server");
  assert.equal(filterContainers(items, { search: "image:redis name:redis" }).length, 1);
  assert.equal(filterContainers(items, { search: "host:nextcloud name:immich" }).length, 0);
});

test("splitHiddenContainers separates hidden containers by host and name", () => {
  const redis = container({ id: "2", name: "redis" });
  const items = [container({ id: "1", name: "immich_server" }), redis];

  assert.equal(containerHideKey(redis), "immich (local)::redis");

  const { visible, concealed } = splitHiddenContainers(items, [containerHideKey(redis)]);

  assert.deepEqual(
    visible.map((item) => item.name),
    ["immich_server"]
  );
  assert.deepEqual(
    concealed.map((item) => item.name),
    ["redis"]
  );
});

test("groupContainers groups by host, status, and provider", () => {
  const items = [
    container({ id: "1", name: "immich_server", status: "running" }),
    container({
      id: "2",
      name: "postgres",
      status: "exited",
      meta: { providerName: "Portainer", endpointName: "nextcloud" },
    }),
    container({ id: "3", name: "redis", status: "running" }),
  ];

  assert.deepEqual(
    groupContainers(items, "none").map((group) => [group.label, group.containers.length]),
    [["", 3]]
  );
  assert.deepEqual(
    groupContainers(items, "host").map((group) => [group.label, group.containers.length]),
    [
      ["immich (local)", 2],
      ["nextcloud", 1],
    ]
  );
  assert.deepEqual(
    groupContainers(items, "status").map((group) => group.label),
    ["running", "exited"]
  );
  assert.deepEqual(
    groupContainers(items, "provider").map((group) => [group.label, group.containers.length]),
    [["Portainer", 3]]
  );
});
