import assert from "node:assert/strict";
import test from "node:test";
import {
  filterStacks,
  getStackSummary,
  listStackEndpointOptions,
  stackEndpointKey,
} from "./stack-filters";
import type { StackResource } from "./types";

const stacks: StackResource[] = [
  {
    id: "provider-1:1",
    name: "media",
    status: "active",
    reportedStatus: "active",
    endpointStatus: "connected",
    type: "Compose",
    endpointId: 7,
    endpointName: "Docker host",
    providerId: "provider-1",
    providerName: "Primary Portainer",
  },
  {
    id: "provider-1:2",
    name: "archive",
    status: "inactive",
    reportedStatus: "inactive",
    endpointStatus: "connected",
    type: "Swarm",
    endpointId: 8,
    endpointName: "Archive host",
    providerId: "provider-1",
    providerName: "Primary Portainer",
  },
  {
    id: "provider-2:3",
    name: "unknown stack",
    status: "unknown",
    reportedStatus: "unknown",
    endpointStatus: "unknown",
    type: "Unknown",
    endpointId: 7,
    endpointName: "Docker host",
    providerId: "provider-2",
    providerName: "Backup Portainer",
  },
  {
    id: "provider-1:4",
    name: "nextcloud",
    status: "unavailable",
    reportedStatus: "active",
    endpointStatus: "disconnected",
    type: "Compose",
    endpointId: 9,
    endpointName: "Nextcloud",
    providerId: "provider-1",
    providerName: "Primary Portainer",
  },
];

test("getStackSummary counts lifecycle states", () => {
  assert.deepEqual(getStackSummary(stacks), {
    total: 4,
    active: 1,
    inactive: 1,
    unknown: 1,
    unavailable: 1,
  });
});

test("listStackEndpointOptions keeps same-named endpoints provider-scoped", () => {
  assert.deepEqual(listStackEndpointOptions(stacks), [
    {
      value: "provider-1:8",
      label: "Archive host · Primary Portainer",
    },
    {
      value: "provider-2:7",
      label: "Docker host · Backup Portainer",
    },
    {
      value: "provider-1:7",
      label: "Docker host · Primary Portainer",
    },
    {
      value: "provider-1:9",
      label: "Nextcloud · Primary Portainer",
    },
  ]);
});

test("filterStacks combines lifecycle, endpoint, and broad text search", () => {
  assert.deepEqual(
    filterStacks(stacks, { status: "active", search: "compose" }).map((stack) => stack.name),
    ["media"]
  );
  assert.deepEqual(
    filterStacks(stacks, { endpoint: stackEndpointKey(stacks[2]!) }).map(
      (stack) => stack.name
    ),
    ["unknown stack"]
  );
  assert.deepEqual(
    filterStacks(stacks, { search: "backup portainer" }).map((stack) => stack.name),
    ["unknown stack"]
  );
  assert.deepEqual(
    filterStacks(stacks, { status: "unavailable" }).map((stack) => stack.name),
    ["nextcloud"]
  );
});
