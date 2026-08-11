export const containerStatusFilters = ["all", "running", "stopped"] as const;
export type ContainerStatusFilter = (typeof containerStatusFilters)[number];

export const containerViewModes = ["list", "grid", "tiles"] as const;
export const containerGroupModes = ["none", "host", "status", "provider"] as const;
export const containerSortFields = [
  "name",
  "state",
  "host",
  "provider",
  "image",
  "createdAt",
] as const;
export const containerSortDirections = ["asc", "desc"] as const;
export const containerDensities = ["comfortable", "compact"] as const;
export const containerVisibleFields = [
  "image",
  "host",
  "provider",
  "ports",
  "statusText",
  "createdAt",
] as const;

export type ContainerViewMode = (typeof containerViewModes)[number];
export type ContainerGroupMode = (typeof containerGroupModes)[number];
export type ContainerSortField = (typeof containerSortFields)[number];
export type ContainerSortDirection = (typeof containerSortDirections)[number];
export type ContainerDensity = (typeof containerDensities)[number];
export type ContainerVisibleField = (typeof containerVisibleFields)[number];

export const CONTAINER_WORKSPACE_VERSION = 1 as const;
export const maxHiddenContainers = 500;
export const maxHiddenKeyLength = 200;
export const maxUserViews = 12;
export const maxViewNameLength = 40;
export const maxSearchLength = 512;

export const BUILTIN_VIEW_IDS = {
  all: "builtin:all",
  running: "builtin:running",
  stopped: "builtin:stopped",
} as const;

export type BuiltinViewId = (typeof BUILTIN_VIEW_IDS)[keyof typeof BUILTIN_VIEW_IDS];

export type ContainerSavedView = {
  id: string;
  name: string;
  search: string;
  status: ContainerStatusFilter;
  host: string;
  provider: string;
  sortField: ContainerSortField;
  sortDirection: ContainerSortDirection;
  groupBy: ContainerGroupMode;
  view: ContainerViewMode;
  density: ContainerDensity;
  visibleFields: ContainerVisibleField[];
};

/**
 * Versioned workspace stored in settings.container_view_prefs.
 * Hidden containers are global across every view.
 */
export type ContainerWorkspacePreferences = {
  version: typeof CONTAINER_WORKSPACE_VERSION;
  activeViewId: string;
  views: ContainerSavedView[];
  hidden: string[];
};

/** @deprecated Prefer ContainerWorkspacePreferences — kept for gradual UI migration. */
export type ContainerViewPreferences = ContainerWorkspacePreferences;

export const defaultVisibleFields: ContainerVisibleField[] = [
  "image",
  "host",
  "provider",
  "ports",
  "statusText",
];

export const defaultViewPresentation = {
  search: "",
  status: "all" as ContainerStatusFilter,
  host: "",
  provider: "",
  sortField: "name" as ContainerSortField,
  sortDirection: "asc" as ContainerSortDirection,
  groupBy: "none" as ContainerGroupMode,
  view: "list" as ContainerViewMode,
  density: "comfortable" as ContainerDensity,
  visibleFields: defaultVisibleFields,
};

export const defaultContainerWorkspacePreferences: ContainerWorkspacePreferences = {
  version: CONTAINER_WORKSPACE_VERSION,
  activeViewId: BUILTIN_VIEW_IDS.all,
  views: [],
  hidden: [],
};

export const defaultContainerViewPreferences = defaultContainerWorkspacePreferences;

export function isBuiltinViewId(id: string): id is BuiltinViewId {
  return (
    id === BUILTIN_VIEW_IDS.all ||
    id === BUILTIN_VIEW_IDS.running ||
    id === BUILTIN_VIEW_IDS.stopped
  );
}

export function builtinViewDefinition(id: BuiltinViewId): ContainerSavedView {
  const base = {
    ...defaultViewPresentation,
    id,
    name:
      id === BUILTIN_VIEW_IDS.running
        ? "Running"
        : id === BUILTIN_VIEW_IDS.stopped
          ? "Stopped"
          : "All",
  };
  if (id === BUILTIN_VIEW_IDS.running) {
    return { ...base, status: "running" };
  }
  if (id === BUILTIN_VIEW_IDS.stopped) {
    return { ...base, status: "stopped" };
  }
  return base;
}

export function resolveActiveView(
  workspace: ContainerWorkspacePreferences
): ContainerSavedView {
  if (isBuiltinViewId(workspace.activeViewId)) {
    return builtinViewDefinition(workspace.activeViewId);
  }
  const found = workspace.views.find((view) => view.id === workspace.activeViewId);
  if (found) {
    return found;
  }
  return builtinViewDefinition(BUILTIN_VIEW_IDS.all);
}

export function normalizeContainerWorkspacePreferences(
  value: unknown
): ContainerWorkspacePreferences {
  if (!value || typeof value !== "object") {
    return defaultContainerWorkspacePreferences;
  }

  const input = value as Record<string, unknown>;

  // Legacy v0 shape: { view, groupBy, hidden }
  if (input.version === undefined && ("view" in input || "groupBy" in input || "hidden" in input)) {
    return {
      version: CONTAINER_WORKSPACE_VERSION,
      activeViewId: BUILTIN_VIEW_IDS.all,
      views: [],
      hidden: normalizeHiddenKeys(input.hidden),
      // Preserve layout/grouping by synthesizing a one-time active builtin overlay
      // applied via activeViewId=all; UI still uses workspace-level migration below.
      ...legacyPresentationPatch(input),
    };
  }

  const views = normalizeUserViews(input.views);
  let activeViewId =
    typeof input.activeViewId === "string" && input.activeViewId.trim()
      ? input.activeViewId.trim()
      : BUILTIN_VIEW_IDS.all;

  if (
    !isBuiltinViewId(activeViewId) &&
    !views.some((view) => view.id === activeViewId)
  ) {
    activeViewId = BUILTIN_VIEW_IDS.all;
  }

  return {
    version: CONTAINER_WORKSPACE_VERSION,
    activeViewId,
    views,
    hidden: normalizeHiddenKeys(input.hidden),
  };
}

/**
 * When upgrading legacy prefs, stash layout/grouping onto a synthetic user view
 * only if they differ from defaults — otherwise keep builtins clean.
 */
function legacyPresentationPatch(input: Record<string, unknown>): Partial<ContainerWorkspacePreferences> {
  const view = pickOption(input.view, containerViewModes, defaultViewPresentation.view);
  const groupBy = pickOption(
    input.groupBy,
    containerGroupModes,
    defaultViewPresentation.groupBy
  );

  if (view === defaultViewPresentation.view && groupBy === defaultViewPresentation.groupBy) {
    return {};
  }

  // Store as a single upgraded user view so preferences survive.
  const upgraded: ContainerSavedView = {
    id: "upgraded-default",
    name: "My view",
    ...defaultViewPresentation,
    view,
    groupBy,
  };

  return {
    activeViewId: upgraded.id,
    views: [upgraded],
  };
}

export function normalizeContainerViewPreferences(value: unknown): ContainerWorkspacePreferences {
  return normalizeContainerWorkspacePreferences(value);
}

export function parseContainerViewPreferences(
  raw: string | null | undefined
): ContainerWorkspacePreferences {
  if (!raw) {
    return defaultContainerWorkspacePreferences;
  }

  try {
    return normalizeContainerWorkspacePreferences(JSON.parse(raw));
  } catch {
    return defaultContainerWorkspacePreferences;
  }
}

export function serializeContainerViewPreferences(value: ContainerWorkspacePreferences) {
  return JSON.stringify(normalizeContainerWorkspacePreferences(value));
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

export function createSavedViewId() {
  return `view_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function normalizeViewName(name: string) {
  return name.trim().slice(0, maxViewNameLength);
}

export function isDuplicateViewName(
  views: ContainerSavedView[],
  name: string,
  exceptId?: string
) {
  const normalized = normalizeViewName(name).toLowerCase();
  if (!normalized) {
    return false;
  }
  return views.some(
    (view) =>
      view.id !== exceptId && view.name.trim().toLowerCase() === normalized
  );
}

export function viewsAreEqual(a: ContainerSavedView, b: ContainerSavedView) {
  return (
    a.search === b.search &&
    a.status === b.status &&
    a.host === b.host &&
    a.provider === b.provider &&
    a.sortField === b.sortField &&
    a.sortDirection === b.sortDirection &&
    a.groupBy === b.groupBy &&
    a.view === b.view &&
    a.density === b.density &&
    sameStringArray(a.visibleFields, b.visibleFields)
  );
}

function sameStringArray(a: string[], b: string[]) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function normalizeUserViews(value: unknown): ContainerSavedView[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const views: ContainerSavedView[] = [];
  const seenNames = new Set<string>();

  for (const item of value) {
    if (views.length >= maxUserViews) {
      break;
    }
    const view = normalizeSavedView(item);
    if (!view || isBuiltinViewId(view.id)) {
      continue;
    }
    const nameKey = view.name.toLowerCase();
    if (seenNames.has(nameKey)) {
      continue;
    }
    seenNames.add(nameKey);
    views.push(view);
  }

  return views;
}

function normalizeSavedView(value: unknown): ContainerSavedView | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const input = value as Record<string, unknown>;
  const id =
    typeof input.id === "string" && input.id.trim()
      ? input.id.trim().slice(0, 64)
      : "";
  const name = normalizeViewName(typeof input.name === "string" ? input.name : "");
  if (!id || !name) {
    return null;
  }

  const status = pickOption(input.status, containerStatusFilters, "all");

  return {
    id,
    name,
    search: typeof input.search === "string" ? input.search.slice(0, maxSearchLength) : "",
    status,
    host: typeof input.host === "string" ? input.host.trim().slice(0, 200) : "",
    provider: typeof input.provider === "string" ? input.provider.trim().slice(0, 200) : "",
    sortField: pickOption(input.sortField, containerSortFields, defaultViewPresentation.sortField),
    sortDirection: pickOption(
      input.sortDirection,
      containerSortDirections,
      defaultViewPresentation.sortDirection
    ),
    groupBy: pickOption(input.groupBy, containerGroupModes, defaultViewPresentation.groupBy),
    view: pickOption(input.view, containerViewModes, defaultViewPresentation.view),
    density: pickOption(input.density, containerDensities, defaultViewPresentation.density),
    visibleFields: normalizeVisibleFields(input.visibleFields),
  };
}

function normalizeVisibleFields(value: unknown): ContainerVisibleField[] {
  if (!Array.isArray(value)) {
    return [...defaultVisibleFields];
  }
  const fields = value.filter(
    (item): item is ContainerVisibleField =>
      typeof item === "string" &&
      (containerVisibleFields as readonly string[]).includes(item)
  );
  return Array.from(new Set(fields));
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
