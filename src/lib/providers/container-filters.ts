import {
  containerHideKey,
  containerHostLabel,
  containerProviderLabel,
  isRunningContainer,
  isStoppedContainer,
} from "@/lib/providers/container-fields";
import { matchesContainerQuery, parseContainerQuery } from "@/lib/providers/container-query";
import type { ContainerGroupMode } from "@/lib/providers/container-preferences";
import type { ProviderResource } from "@/lib/providers/types";

export {
  containerHideKey,
  containerHostLabel,
  containerLabelPairs,
  containerProviderCaption,
  containerProviderLabel,
  isRunningContainer,
  isStoppedContainer,
} from "@/lib/providers/container-fields";

export type ContainerStatusFilter = "all" | "running" | "stopped";

export type ContainerGroup = {
  key: string;
  label: string;
  containers: ProviderResource[];
};

export function listContainerHostOptions(containers: ProviderResource[]) {
  return Array.from(new Set(containers.map(containerHostLabel))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export function filterContainers(
  containers: ProviderResource[],
  options: {
    status?: ContainerStatusFilter;
    host?: string;
    search?: string;
  } = {}
) {
  const status = options.status ?? "all";
  const host = options.host?.trim() ?? "";
  const terms = parseContainerQuery(options.search ?? "");

  return containers.filter((container) => {
    if (status === "running" && !isRunningContainer(container.status)) {
      return false;
    }
    if (status === "stopped" && !isStoppedContainer(container.status)) {
      return false;
    }
    if (host && containerHostLabel(container) !== host) {
      return false;
    }

    return matchesContainerQuery(container, terms);
  });
}

/** Separates containers the user chose to hide from the rest. */
export function splitHiddenContainers(containers: ProviderResource[], hiddenKeys: string[]) {
  const hidden = new Set(hiddenKeys);
  const visible: ProviderResource[] = [];
  const concealed: ProviderResource[] = [];

  for (const container of containers) {
    if (hidden.has(containerHideKey(container))) {
      concealed.push(container);
    } else {
      visible.push(container);
    }
  }

  return { visible, concealed };
}

export function groupContainers(
  containers: ProviderResource[],
  groupBy: ContainerGroupMode
): ContainerGroup[] {
  if (groupBy === "none") {
    return [{ key: "all", label: "", containers }];
  }

  const groups = new Map<string, ContainerGroup>();

  for (const container of containers) {
    const label = groupLabel(container, groupBy);
    const group = groups.get(label);

    if (group) {
      group.containers.push(container);
      continue;
    }

    groups.set(label, { key: `${groupBy}:${label}`, label, containers: [container] });
  }

  return Array.from(groups.values()).sort((a, b) => compareGroups(a.label, b.label, groupBy));
}

function groupLabel(container: ProviderResource, groupBy: ContainerGroupMode) {
  if (groupBy === "host") {
    return containerHostLabel(container);
  }
  if (groupBy === "provider") {
    return containerProviderLabel(container);
  }

  return container.status || "unknown";
}

const statusRank: Record<string, number> = {
  running: 0,
  restarting: 1,
  paused: 2,
  created: 3,
  exited: 4,
  dead: 5,
};

function compareGroups(a: string, b: string, groupBy: ContainerGroupMode) {
  if (groupBy === "status") {
    const rankDelta = (statusRank[a] ?? 9) - (statusRank[b] ?? 9);
    if (rankDelta !== 0) {
      return rankDelta;
    }
  }

  return a.localeCompare(b);
}
