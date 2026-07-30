import assert from "node:assert/strict";
import test from "node:test";
import {
  getCachedContainerList,
  invalidateContainerListCache,
  setCachedContainerList,
} from "./container-list-cache";

test("container list cache returns within TTL and invalidates", () => {
  invalidateContainerListCache();
  const now = Date.now();

  setCachedContainerList(
    {
      resources: [
        {
          id: "1",
          kind: "container",
          name: "nginx",
          status: "running",
          providerType: "docker",
        },
      ],
      warning: "endpoint skipped",
    },
    now
  );

  const cached = getCachedContainerList(now + 1_000);
  assert.ok(cached);
  assert.equal(cached.resources[0]?.name, "nginx");
  assert.equal(cached.warning, "endpoint skipped");
  assert.equal(getCachedContainerList(now + 30_000), null);

  setCachedContainerList({ resources: [] }, now);
  invalidateContainerListCache();
  assert.equal(getCachedContainerList(now), null);
});
