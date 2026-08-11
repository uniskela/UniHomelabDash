import type { ContainerLabelEntry } from "@/lib/providers/types";

/** Operational label keys whose values are safe to show in the browser. */
export const CONTAINER_LABEL_VALUE_ALLOWLIST = [
  "com.docker.compose.project",
  "com.docker.stack.namespace",
  "org.opencontainers.image.title",
  "org.opencontainers.image.version",
  "org.opencontainers.image.vendor",
] as const;

const allowlist = new Set<string>(CONTAINER_LABEL_VALUE_ALLOWLIST);

const maxLabelKeyLength = 200;
const maxLabelValueLength = 200;
const maxLabelCount = 100;

export function isAllowlistedLabelKey(key: string) {
  return allowlist.has(key);
}

/**
 * Sanitize a Docker labels map for client exposure.
 * - Every key is kept (trimmed/bounded) so `label:` search can match keys.
 * - Only allowlisted values are included; others are empty strings.
 */
export function sanitizeLabelsRecord(
  labels: Record<string, string> | null | undefined
): Record<string, string> {
  if (!labels || typeof labels !== "object") {
    return {};
  }

  const entries = Object.entries(labels)
    .map(([rawKey, rawValue]) => {
      const key = String(rawKey ?? "")
        .trim()
        .slice(0, maxLabelKeyLength);
      if (!key) {
        return null;
      }
      const value =
        isAllowlistedLabelKey(key) && typeof rawValue === "string"
          ? sanitizeLabelValue(rawValue)
          : "";
      return [key, value] as const;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry))
    .slice(0, maxLabelCount);

  return Object.fromEntries(entries);
}

/** Detail/inspect representation with explicit visibility flags. */
export function sanitizeLabelsToEntries(
  labels: Record<string, string> | null | undefined
): ContainerLabelEntry[] {
  if (!labels || typeof labels !== "object") {
    return [];
  }

  return Object.entries(labels)
    .map(([rawKey, rawValue]) => {
      const key = String(rawKey ?? "")
        .trim()
        .slice(0, maxLabelKeyLength);
      if (!key) {
        return null;
      }
      const visible = isAllowlistedLabelKey(key) && typeof rawValue === "string";
      return {
        key,
        value: visible ? sanitizeLabelValue(rawValue) : null,
        visible,
      } satisfies ContainerLabelEntry;
    })
    .filter((entry): entry is ContainerLabelEntry => Boolean(entry))
    .slice(0, maxLabelCount);
}

function sanitizeLabelValue(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLabelValueLength);
}
