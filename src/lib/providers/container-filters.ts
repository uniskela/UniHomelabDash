import type { ProviderResource } from "@/lib/providers/types";

export type ContainerStatusFilter = "all" | "running" | "stopped";

export function isRunningContainer(status: string) {
  return status === "running" || status === "restarting";
}

export function isStoppedContainer(status: string) {
  return status === "exited" || status === "dead" || status === "created" || status === "paused";
}

/** Prefer Portainer endpoint name, then remote host, then provider name. */
export function containerHostLabel(container: ProviderResource) {
  const endpointName = container.meta?.endpointName?.trim();
  if (endpointName) {
    return endpointName;
  }

  const providerHost = container.meta?.providerHost?.trim();
  if (providerHost) {
    return providerHost;
  }

  return container.meta?.providerName?.trim() || "Unknown host";
}

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
  const search = options.search?.trim().toLowerCase() ?? "";

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
    if (!search) {
      return true;
    }

    const haystack = [
      container.name,
      container.image,
      container.summary,
      container.id,
      container.meta?.providerName,
      container.meta?.endpointName,
      container.meta?.providerHost,
      ...(container.ports ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}
