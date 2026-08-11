import assert from "node:assert/strict";
import test from "node:test";
import {
  isAllowlistedLabelKey,
  sanitizeLabelsRecord,
  sanitizeLabelsToEntries,
} from "./container-labels";
import { normalizeSafeMounts, normalizeDockerInspect } from "./docker/inspect-normalize";
import {
  normalizeBlockIo,
  normalizeCpuPercent,
  normalizeDockerStats,
  normalizeMemory,
  normalizeNetwork,
} from "./docker/stats-normalize";
import {
  CONTAINER_INSPECT_CACHE_TTL_MS,
  CONTAINER_STATS_CACHE_TTL_MS,
  getCachedContainerInspect,
  getCachedContainerStats,
  invalidateContainerDetailCache,
  resetContainerDetailCaches,
  setCachedContainerInspect,
  setCachedContainerStats,
} from "./container-detail-cache";

test("sanitizeLabelsRecord keeps keys and only allowlisted values", () => {
  const sanitized = sanitizeLabelsRecord({
    "com.docker.compose.project": "immich",
    "org.opencontainers.image.version": "v1.2.3",
    "secret.label": "super-secret-token",
    "com.docker.stack.namespace": "swarm-app",
  });

  assert.equal(sanitized["com.docker.compose.project"], "immich");
  assert.equal(sanitized["org.opencontainers.image.version"], "v1.2.3");
  assert.equal(sanitized["com.docker.stack.namespace"], "swarm-app");
  assert.equal(sanitized["secret.label"], "");
  assert.equal(isAllowlistedLabelKey("secret.label"), false);
});

test("sanitizeLabelsToEntries marks non-allowlisted values hidden", () => {
  const entries = sanitizeLabelsToEntries({
    "org.opencontainers.image.title": "Nginx",
    "password": "hunter2",
  });

  assert.deepEqual(entries.find((entry) => entry.key === "org.opencontainers.image.title"), {
    key: "org.opencontainers.image.title",
    value: "Nginx",
    visible: true,
  });
  assert.deepEqual(entries.find((entry) => entry.key === "password"), {
    key: "password",
    value: null,
    visible: false,
  });
});

test("normalizeSafeMounts omits bind source paths", () => {
  const mounts = normalizeSafeMounts([
    {
      Type: "bind",
      Source: "/home/alex/secrets",
      Destination: "/config",
      RW: false,
    },
    {
      Type: "volume",
      Name: "data-vol",
      Source: "/var/lib/docker/volumes/data-vol/_data",
      Destination: "/data",
      RW: true,
    },
  ]);

  assert.deepEqual(mounts, [
    { type: "bind", destination: "/config", readOnly: true, name: null },
    { type: "volume", destination: "/data", readOnly: false, name: "data-vol" },
  ]);
  assert.ok(!JSON.stringify(mounts).includes("/home/alex/secrets"));
});

test("normalizeDockerInspect omits env, cmd, health log, and raw secrets", () => {
  const detail = normalizeDockerInspect({
    payload: {
      Id: "abc",
      Name: "/web",
      Created: "2024-01-01T00:00:00Z",
      Image: "sha256:deadbeef",
      Platform: "linux/amd64",
      State: {
        Status: "running",
        StartedAt: "2024-01-01T01:00:00Z",
        FinishedAt: "0001-01-01T00:00:00Z",
        Health: { Status: "healthy", Log: [{ Output: "secret-health-output" }] },
      },
      HostConfig: {
        Memory: 268435456,
        NanoCpus: 1_000_000_000,
        RestartPolicy: { Name: "unless-stopped", MaximumRetryCount: 0 },
      },
      Config: {
        Image: "nginx:latest",
        Env: ["PASSWORD=hunter2"],
        Cmd: ["/bin/sh", "-c", "echo secret"],
        Labels: {
          "com.docker.compose.project": "web",
          "secret": "nope",
        },
      },
      NetworkSettings: {
        Networks: { bridge: {} },
        Ports: { "80/tcp": [{ HostIp: "0.0.0.0", HostPort: "8080" }] },
      },
      Mounts: [{ Type: "bind", Source: "/etc/passwd", Destination: "/host", RW: true }],
    },
    providerId: "prov-1",
    providerType: "docker",
    resourceId: "abc",
  });

  assert.ok(detail);
  assert.equal(detail?.health, "healthy");
  assert.equal(detail?.image, "nginx:latest");
  assert.equal(detail?.platform, "linux/amd64");
  assert.deepEqual(detail?.networks, ["bridge"]);
  assert.equal(detail?.limits.memoryBytes, 268435456);
  assert.ok(!JSON.stringify(detail).includes("PASSWORD"));
  assert.ok(!JSON.stringify(detail).includes("hunter2"));
  assert.ok(!JSON.stringify(detail).includes("secret-health-output"));
  assert.ok(!JSON.stringify(detail).includes("/etc/passwd"));
  assert.ok(!JSON.stringify(detail).includes("/bin/sh"));
});

test("normalizeCpuPercent returns null when counters missing", () => {
  assert.equal(normalizeCpuPercent({}), null);
  assert.equal(
    normalizeCpuPercent({
      cpu_stats: { cpu_usage: { total_usage: 100 }, system_cpu_usage: 200, online_cpus: 2 },
      precpu_stats: {},
    }),
    null
  );
});

test("normalizeCpuPercent computes delta percentage", () => {
  const percent = normalizeCpuPercent({
    cpu_stats: {
      cpu_usage: { total_usage: 200, percpu_usage: [1, 1] },
      system_cpu_usage: 400,
      online_cpus: 2,
    },
    precpu_stats: {
      cpu_usage: { total_usage: 100 },
      system_cpu_usage: 200,
    },
  });
  assert.equal(percent, 100);
});

test("normalizeMemory uses working set and nulls missing usage", () => {
  assert.deepEqual(normalizeMemory(undefined), { usage: null, limit: null, percent: null });
  assert.deepEqual(
    normalizeMemory({ usage: 1000, limit: 2000, stats: { cache: 200 } }),
    { usage: 800, limit: 2000, percent: 40 }
  );
  assert.deepEqual(
    normalizeMemory({ usage: 1000, limit: 2000, stats: { inactive_file: 100 } }),
    { usage: 900, limit: 2000, percent: 45 }
  );
});

test("normalizeNetwork and block IO sum interfaces and never fabricate zeroes", () => {
  assert.deepEqual(normalizeNetwork(undefined), { rx: null, tx: null });
  assert.deepEqual(
    normalizeNetwork({ eth0: { rx_bytes: 10, tx_bytes: 5 }, eth1: { rx_bytes: 2 } }),
    { rx: 12, tx: 5 }
  );
  assert.deepEqual(normalizeBlockIo(null), { read: null, write: null });
  assert.deepEqual(
    normalizeBlockIo([
      { op: "Read", value: 3 },
      { op: "Write", value: 7 },
      { op: "Read", value: 1 },
    ]),
    { read: 4, write: 7 }
  );
});

test("normalizeDockerStats returns null for malformed payload", () => {
  assert.equal(normalizeDockerStats(null), null);
  assert.equal(normalizeDockerStats("nope"), null);
});

test("container detail caches isolate keys, honour TTLs, and invalidate", () => {
  resetContainerDetailCaches();
  const detail = {
    id: "c1",
    name: "web",
    state: "running" as const,
    status: "running",
    health: "none" as const,
    image: "nginx",
    imageId: null,
    platform: null,
    createdAt: null,
    startedAt: null,
    finishedAt: null,
    restartPolicy: null,
    ports: [],
    networks: [],
    mounts: [],
    limits: { memoryBytes: null, nanoCpus: null, cpuShares: null, pidsLimit: null },
    labels: [],
    providerType: "docker" as const,
    providerId: "p1",
  };
  const stats = {
    sampledAt: new Date().toISOString(),
    cpuPercent: 1,
    memoryUsageBytes: 1,
    memoryLimitBytes: 2,
    memoryPercent: 50,
    networkRxBytes: null,
    networkTxBytes: null,
    blockReadBytes: null,
    blockWriteBytes: null,
    pids: 1,
  };

  const now = 1_000_000;
  setCachedContainerInspect("p1", "c1", detail, now);
  setCachedContainerStats("p1", "c1", stats, now);
  setCachedContainerInspect("p2", "c1", { ...detail, providerId: "p2" }, now);

  assert.equal(getCachedContainerInspect("p1", "c1", now)?.detail.providerId, "p1");
  assert.equal(getCachedContainerInspect("p2", "c1", now)?.detail.providerId, "p2");
  assert.equal(getCachedContainerStats("p1", "c1", now)?.stats.cpuPercent, 1);

  assert.equal(
    getCachedContainerInspect("p1", "c1", now + CONTAINER_INSPECT_CACHE_TTL_MS),
    null
  );
  assert.equal(
    getCachedContainerStats("p1", "c1", now + CONTAINER_STATS_CACHE_TTL_MS),
    null
  );

  setCachedContainerInspect("p1", "c1", detail, now);
  setCachedContainerStats("p1", "c1", stats, now);
  invalidateContainerDetailCache("p1", "c1");
  assert.equal(getCachedContainerInspect("p1", "c1", now), null);
  assert.equal(getCachedContainerStats("p1", "c1", now), null);
  assert.ok(getCachedContainerInspect("p2", "c1", now));
});
