import type { ContainerStatsSnapshot } from "@/lib/providers/types";

export type DockerStatsPayload = {
  read?: string;
  pids_stats?: { current?: number };
  networks?: Record<string, { rx_bytes?: number; tx_bytes?: number }>;
  memory_stats?: {
    usage?: number;
    max_usage?: number;
    limit?: number;
    stats?: {
      cache?: number;
      inactive_file?: number;
    };
  };
  blkio_stats?: {
    io_service_bytes_recursive?: Array<{
      major?: number;
      minor?: number;
      op?: string;
      value?: number;
    }> | null;
  };
  cpu_stats?: {
    cpu_usage?: {
      total_usage?: number;
      percpu_usage?: number[];
    };
    system_cpu_usage?: number;
    online_cpus?: number;
  };
  precpu_stats?: {
    cpu_usage?: {
      total_usage?: number;
    };
    system_cpu_usage?: number;
  };
};

/**
 * Normalize a non-streaming Docker stats payload.
 * Missing counters produce null — never fabricated zeroes.
 */
export function normalizeDockerStats(payload: unknown, sampledAt = new Date()): ContainerStatsSnapshot | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const stats = payload as DockerStatsPayload;
  const memory = normalizeMemory(stats.memory_stats);
  const cpuPercent = normalizeCpuPercent(stats);
  const network = normalizeNetwork(stats.networks);
  const block = normalizeBlockIo(stats.blkio_stats?.io_service_bytes_recursive);
  const pids =
    typeof stats.pids_stats?.current === "number" && Number.isFinite(stats.pids_stats.current)
      ? stats.pids_stats.current
      : null;

  const readAt =
    typeof stats.read === "string" && Number.isFinite(Date.parse(stats.read))
      ? new Date(stats.read).toISOString()
      : sampledAt.toISOString();

  return {
    sampledAt: readAt,
    cpuPercent,
    memoryUsageBytes: memory.usage,
    memoryLimitBytes: memory.limit,
    memoryPercent: memory.percent,
    networkRxBytes: network.rx,
    networkTxBytes: network.tx,
    blockReadBytes: block.read,
    blockWriteBytes: block.write,
    pids,
  };
}

export function normalizeCpuPercent(stats: DockerStatsPayload): number | null {
  const cpuDelta =
    finiteDiff(stats.cpu_stats?.cpu_usage?.total_usage, stats.precpu_stats?.cpu_usage?.total_usage);
  const systemDelta = finiteDiff(
    stats.cpu_stats?.system_cpu_usage,
    stats.precpu_stats?.system_cpu_usage
  );

  if (cpuDelta === null || systemDelta === null || systemDelta <= 0 || cpuDelta < 0) {
    return null;
  }

  const onlineCpus =
    (typeof stats.cpu_stats?.online_cpus === "number" && stats.cpu_stats.online_cpus > 0
      ? stats.cpu_stats.online_cpus
      : null) ??
    (Array.isArray(stats.cpu_stats?.cpu_usage?.percpu_usage)
      ? stats.cpu_stats.cpu_usage.percpu_usage.length
      : null);

  if (!onlineCpus || onlineCpus <= 0) {
    return null;
  }

  const percent = (cpuDelta / systemDelta) * onlineCpus * 100;
  if (!Number.isFinite(percent) || percent < 0) {
    return null;
  }
  return Math.round(percent * 100) / 100;
}

/**
 * Working set ≈ usage − inactive_file (cgroup v2) or usage − cache (cgroup v1).
 */
export function normalizeMemory(
  memoryStats: DockerStatsPayload["memory_stats"]
): { usage: number | null; limit: number | null; percent: number | null } {
  const usageRaw =
    typeof memoryStats?.usage === "number" && Number.isFinite(memoryStats.usage)
      ? memoryStats.usage
      : null;
  if (usageRaw === null) {
    return { usage: null, limit: null, percent: null };
  }

  const inactiveFile = memoryStats?.stats?.inactive_file;
  const cache = memoryStats?.stats?.cache;
  let workingSet = usageRaw;
  if (typeof inactiveFile === "number" && Number.isFinite(inactiveFile) && inactiveFile >= 0) {
    workingSet = Math.max(0, usageRaw - inactiveFile);
  } else if (typeof cache === "number" && Number.isFinite(cache) && cache >= 0) {
    workingSet = Math.max(0, usageRaw - cache);
  }

  const limit =
    typeof memoryStats?.limit === "number" &&
    Number.isFinite(memoryStats.limit) &&
    memoryStats.limit > 0
      ? memoryStats.limit
      : null;

  const percent =
    limit !== null && limit > 0
      ? Math.round((workingSet / limit) * 10000) / 100
      : null;

  return { usage: workingSet, limit, percent };
}

export function normalizeNetwork(
  networks: DockerStatsPayload["networks"]
): { rx: number | null; tx: number | null } {
  if (!networks || typeof networks !== "object") {
    return { rx: null, tx: null };
  }

  let rx = 0;
  let tx = 0;
  let sawRx = false;
  let sawTx = false;

  for (const iface of Object.values(networks)) {
    if (!iface || typeof iface !== "object") {
      continue;
    }
    if (typeof iface.rx_bytes === "number" && Number.isFinite(iface.rx_bytes)) {
      rx += iface.rx_bytes;
      sawRx = true;
    }
    if (typeof iface.tx_bytes === "number" && Number.isFinite(iface.tx_bytes)) {
      tx += iface.tx_bytes;
      sawTx = true;
    }
  }

  return {
    rx: sawRx ? rx : null,
    tx: sawTx ? tx : null,
  };
}

export function normalizeBlockIo(
  entries:
    | (DockerStatsPayload["blkio_stats"] extends infer B
        ? B extends { io_service_bytes_recursive?: infer R }
          ? R
          : never
        : never)
    | undefined
): { read: number | null; write: number | null } {
  if (!Array.isArray(entries)) {
    return { read: null, write: null };
  }

  let read = 0;
  let write = 0;
  let sawRead = false;
  let sawWrite = false;

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const op = typeof entry.op === "string" ? entry.op.toLowerCase() : "";
    const value =
      typeof entry.value === "number" && Number.isFinite(entry.value) ? entry.value : null;
    if (value === null) {
      continue;
    }
    if (op === "read") {
      read += value;
      sawRead = true;
    } else if (op === "write") {
      write += value;
      sawWrite = true;
    }
  }

  return {
    read: sawRead ? read : null,
    write: sawWrite ? write : null,
  };
}

function finiteDiff(current: number | undefined, previous: number | undefined) {
  if (
    typeof current !== "number" ||
    typeof previous !== "number" ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous)
  ) {
    return null;
  }
  return current - previous;
}
