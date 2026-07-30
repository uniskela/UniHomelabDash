import type { ProviderResource } from "@/lib/providers/types";

export type ContainerListSnapshot = {
  resources: ProviderResource[];
  error?: string;
  warning?: string;
  cachedAt: number;
};

let snapshot: ContainerListSnapshot | null = null;

export function getContainerListCacheTtlMs() {
  const configured = Number.parseInt(process.env.UH_CONTAINER_LIST_CACHE_MS ?? "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 30_000;
}

export function getCachedContainerList(now = Date.now()): ContainerListSnapshot | null {
  if (!snapshot) {
    return null;
  }

  if (now - snapshot.cachedAt >= getContainerListCacheTtlMs()) {
    snapshot = null;
    return null;
  }

  return snapshot;
}

export function setCachedContainerList(
  value: Omit<ContainerListSnapshot, "cachedAt">,
  now = Date.now()
) {
  snapshot = {
    ...value,
    cachedAt: now,
  };
  return snapshot;
}

export function invalidateContainerListCache() {
  snapshot = null;
}
