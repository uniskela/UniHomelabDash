import type { ContainerDetailResult, ContainerStatsResult } from "@/lib/providers/types";

type InspectCacheEntry = {
  result: Extract<ContainerDetailResult, { kind: "ok" }>;
  cachedAt: number;
};

type StatsCacheEntry = {
  result: Extract<ContainerStatsResult, { kind: "ok" }>;
  cachedAt: number;
};

const inspectCache = new Map<string, InspectCacheEntry>();
const statsCache = new Map<string, StatsCacheEntry>();

export const CONTAINER_INSPECT_CACHE_TTL_MS = 30_000;
export const CONTAINER_STATS_CACHE_TTL_MS = 5_000;

export function containerDetailCacheKey(providerId: string, resourceId: string) {
  return `${providerId}::${resourceId}`;
}

export function getCachedContainerInspect(
  providerId: string,
  resourceId: string,
  now = Date.now()
): Extract<ContainerDetailResult, { kind: "ok" }> | null {
  const key = containerDetailCacheKey(providerId, resourceId);
  const entry = inspectCache.get(key);
  if (!entry) {
    return null;
  }
  if (now - entry.cachedAt >= CONTAINER_INSPECT_CACHE_TTL_MS) {
    inspectCache.delete(key);
    return null;
  }
  return { ...entry.result, cachedAt: entry.cachedAt };
}

export function setCachedContainerInspect(
  providerId: string,
  resourceId: string,
  detail: Extract<ContainerDetailResult, { kind: "ok" }>["detail"],
  now = Date.now()
) {
  const result = { kind: "ok" as const, detail, cachedAt: now };
  inspectCache.set(containerDetailCacheKey(providerId, resourceId), {
    result,
    cachedAt: now,
  });
  return result;
}

export function getCachedContainerStats(
  providerId: string,
  resourceId: string,
  now = Date.now()
): Extract<ContainerStatsResult, { kind: "ok" }> | null {
  const key = containerDetailCacheKey(providerId, resourceId);
  const entry = statsCache.get(key);
  if (!entry) {
    return null;
  }
  if (now - entry.cachedAt >= CONTAINER_STATS_CACHE_TTL_MS) {
    statsCache.delete(key);
    return null;
  }
  return { ...entry.result, cachedAt: entry.cachedAt };
}

export function setCachedContainerStats(
  providerId: string,
  resourceId: string,
  stats: Extract<ContainerStatsResult, { kind: "ok" }>["stats"],
  now = Date.now()
) {
  const result = { kind: "ok" as const, stats, cachedAt: now };
  statsCache.set(containerDetailCacheKey(providerId, resourceId), {
    result,
    cachedAt: now,
  });
  return result;
}

export function invalidateContainerDetailCache(providerId?: string, resourceId?: string) {
  if (!providerId) {
    inspectCache.clear();
    statsCache.clear();
    return;
  }
  if (!resourceId) {
    for (const key of [...inspectCache.keys()]) {
      if (key.startsWith(`${providerId}::`)) {
        inspectCache.delete(key);
      }
    }
    for (const key of [...statsCache.keys()]) {
      if (key.startsWith(`${providerId}::`)) {
        statsCache.delete(key);
      }
    }
    return;
  }
  const key = containerDetailCacheKey(providerId, resourceId);
  inspectCache.delete(key);
  statsCache.delete(key);
}

/** Test helper. */
export function resetContainerDetailCaches() {
  inspectCache.clear();
  statsCache.clear();
}
