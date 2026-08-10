import assert from "node:assert/strict";
import test from "node:test";
import {
  getCachedStackMembership,
  invalidateStackMembershipCache,
  setCachedStackMembership,
} from "./stack-membership-cache";
import type { StackContainerResource } from "./types";

const resources: StackContainerResource[] = [
  {
    id: "7:container-1",
    name: "nextcloud",
    state: "running",
    status: "Up 1 hour",
    image: "nextcloud:latest",
    ports: [],
    providerId: "provider-1",
    providerName: "Primary Portainer",
    endpointId: 7,
    endpointName: "Docker host",
  },
];

test("stack membership cache isolates keys, expires after 30 seconds, and returns copies", () => {
  invalidateStackMembershipCache();
  const now = 1_700_000_000_000;

  setCachedStackMembership("provider-1:42", resources, now);

  const cached = getCachedStackMembership("provider-1:42", now + 29_999);
  assert.ok(cached);
  assert.equal(cached.cachedAt, now);
  assert.deepEqual(cached.resources, resources);
  assert.notEqual(cached.resources, resources);
  cached.resources.pop();
  assert.equal(getCachedStackMembership("provider-1:42", now)?.resources.length, 1);
  assert.equal(getCachedStackMembership("provider-1:42", now + 30_000), null);
  assert.equal(getCachedStackMembership("provider-2:42", now), null);
});

test("stack membership cache globally invalidates every stack snapshot", () => {
  invalidateStackMembershipCache();
  const now = 1_700_000_000_000;
  setCachedStackMembership("provider-1:42", resources, now);
  setCachedStackMembership("provider-2:42", resources, now);

  invalidateStackMembershipCache();

  assert.equal(getCachedStackMembership("provider-1:42", now), null);
  assert.equal(getCachedStackMembership("provider-2:42", now), null);
});
