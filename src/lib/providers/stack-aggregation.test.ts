import assert from "node:assert/strict";
import test from "node:test";
import { aggregateStackListings } from "./stack-aggregation";
import type { StackResource } from "./types";

const mediaStack: StackResource = {
  id: "provider-1:42",
  name: "media",
  status: "active",
  reportedStatus: "active",
  endpointStatus: "connected",
  type: "Compose",
  endpointId: 7,
  endpointName: "Docker host",
  providerId: "provider-1",
  providerName: "Primary Portainer",
};

test("aggregateStackListings preserves healthy results and redacts partial failures", async () => {
  const result = await aggregateStackListings([
    {
      name: "Primary Portainer",
      list: async () => ({ resources: [mediaStack] }),
    },
    {
      name: "Backup Portainer",
      list: async () => {
        throw new Error("X-API-Key: super-secret");
      },
    },
  ]);

  assert.deepEqual(result.resources, [mediaStack]);
  assert.equal(result.error, undefined);
  assert.match(result.warning ?? "", /Backup Portainer/);
  assert.doesNotMatch(result.warning ?? "", /super-secret/);
});

test("aggregateStackListings reports an error only when every provider fails", async () => {
  const partial = await aggregateStackListings([
    { name: "Empty", list: async () => ({ resources: [] }) },
    { name: "Offline", list: async () => Promise.reject(new Error("unreachable")) },
  ]);
  assert.equal(partial.error, undefined);
  assert.match(partial.warning ?? "", /Offline: unreachable/);

  const failed = await aggregateStackListings([
    { name: "Offline", list: async () => Promise.reject(new Error("unreachable")) },
  ]);
  assert.deepEqual(failed.resources, []);
  assert.equal(failed.warning, undefined);
  assert.match(failed.error ?? "", /Offline: unreachable/);
});
