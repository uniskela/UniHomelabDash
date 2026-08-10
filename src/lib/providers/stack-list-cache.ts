import type { StackResource } from "@/lib/providers/types";

export type StackListSnapshot = {
  resources: StackResource[];
  error?: string;
  warning?: string;
  cachedAt: number;
};

const STACK_LIST_CACHE_TTL_MS = 30_000;
let snapshot: StackListSnapshot | null = null;

export function getCachedStackList(now = Date.now()): StackListSnapshot | null {
  if (!snapshot) {
    return null;
  }

  if (now - snapshot.cachedAt >= STACK_LIST_CACHE_TTL_MS) {
    snapshot = null;
    return null;
  }

  return snapshot;
}

export function setCachedStackList(
  value: Omit<StackListSnapshot, "cachedAt">,
  now = Date.now()
) {
  snapshot = { ...value, cachedAt: now };
  return snapshot;
}

export function invalidateStackListCache() {
  snapshot = null;
}
