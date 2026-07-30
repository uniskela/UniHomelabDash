export const containerViewModes = ["list", "grid", "tiles"] as const;
export const containerGroupModes = ["none", "host", "status", "provider"] as const;

export type ContainerViewMode = (typeof containerViewModes)[number];
export type ContainerGroupMode = (typeof containerGroupModes)[number];

export type ContainerViewPreferences = {
  view: ContainerViewMode;
  groupBy: ContainerGroupMode;
  hidden: string[];
};

/** Bounds on stored preferences so the settings row cannot grow without limit. */
export const maxHiddenContainers = 500;
export const maxHiddenKeyLength = 200;

export const defaultContainerViewPreferences: ContainerViewPreferences = {
  view: "list",
  groupBy: "none",
  hidden: [],
};

export function normalizeContainerViewPreferences(value: unknown): ContainerViewPreferences {
  if (!value || typeof value !== "object") {
    return defaultContainerViewPreferences;
  }

  const input = value as Partial<Record<keyof ContainerViewPreferences, unknown>>;

  return {
    view: pickOption(input.view, containerViewModes, defaultContainerViewPreferences.view),
    groupBy: pickOption(
      input.groupBy,
      containerGroupModes,
      defaultContainerViewPreferences.groupBy
    ),
    hidden: normalizeHiddenKeys(input.hidden),
  };
}

export function parseContainerViewPreferences(
  raw: string | null | undefined
): ContainerViewPreferences {
  if (!raw) {
    return defaultContainerViewPreferences;
  }

  try {
    return normalizeContainerViewPreferences(JSON.parse(raw));
  } catch {
    return defaultContainerViewPreferences;
  }
}

export function serializeContainerViewPreferences(value: ContainerViewPreferences) {
  return JSON.stringify(normalizeContainerViewPreferences(value));
}

export function toggleHiddenContainer(hidden: string[], key: string) {
  const trimmed = key.trim();

  if (!trimmed) {
    return hidden;
  }

  if (hidden.includes(trimmed)) {
    return hidden.filter((item) => item !== trimmed);
  }

  return normalizeHiddenKeys([...hidden, trimmed]);
}

function normalizeHiddenKeys(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const keys = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxHiddenKeyLength))
    .filter(Boolean);

  return Array.from(new Set(keys)).slice(0, maxHiddenContainers);
}

function pickOption<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && (options as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}
