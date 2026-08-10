import assert from "node:assert/strict";
import test from "node:test";
import {
  getCachedStackList,
  invalidateStackListCache,
  setCachedStackList,
} from "./stack-list-cache";

test("stack list cache returns snapshots for 30 seconds and invalidates", () => {
  invalidateStackListCache();
  const now = Date.now();

  setCachedStackList(
    {
      resources: [
        {
          id: "provider-1:42",
          name: "media",
          status: "active",
          type: "Compose",
          endpointId: 7,
          endpointName: "Docker host",
          providerId: "provider-1",
          providerName: "Primary Portainer",
        },
      ],
      warning: "Backup Portainer: request timed out.",
    },
    now
  );

  const cached = getCachedStackList(now + 1_000);
  assert.ok(cached);
  assert.equal(cached.resources[0]?.name, "media");
  assert.equal(cached.warning, "Backup Portainer: request timed out.");
  assert.equal(getCachedStackList(now + 30_000), null);

  setCachedStackList({ resources: [] }, now);
  invalidateStackListCache();
  assert.equal(getCachedStackList(now), null);
});
