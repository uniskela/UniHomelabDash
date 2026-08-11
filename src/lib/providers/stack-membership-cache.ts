import type { StackContainerResource } from "@/lib/providers/types";

const STACK_MEMBERSHIP_CACHE_TTL_MS = 30_000;

export type StackMembershipSnapshot = {
  resources: StackContainerResource[];
  cachedAt: number;
};

const snapshots = new Map<string, StackMembershipSnapshot>();

export function getCachedStackMembership(
  key: string,
  now = Date.now()
): StackMembershipSnapshot | null {
  const snapshot = snapshots.get(key);
  if (!snapshot) {
    return null;
  }

  if (now - snapshot.cachedAt >= STACK_MEMBERSHIP_CACHE_TTL_MS) {
    snapshots.delete(key);
    return null;
  }

  return { ...snapshot, resources: [...snapshot.resources] };
}

export function setCachedStackMembership(
  key: string,
  resources: StackContainerResource[],
  now = Date.now()
): StackMembershipSnapshot {
  const snapshot = { resources: [...resources], cachedAt: now };
  snapshots.set(key, snapshot);
  return { ...snapshot, resources: [...snapshot.resources] };
}

export function invalidateStackMembershipCache() {
  snapshots.clear();
}
