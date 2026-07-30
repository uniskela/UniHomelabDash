import type { ProviderResource } from "@/lib/providers/types";

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

export function containerProviderLabel(container: ProviderResource) {
  return container.meta?.providerName?.trim() || container.providerType;
}

/** Caption such as "Portainer · immich (local)" shown on cards and dialogs. */
export function containerProviderCaption(container: ProviderResource) {
  const provider = containerProviderLabel(container);
  const endpointName = container.meta?.endpointName?.trim();

  return endpointName ? `${provider} · ${endpointName}` : provider;
}

/**
 * Identifies a container across recreations. Docker ids change whenever a
 * container is recreated (compose up, image pull), so hiding is keyed on the
 * host plus container name instead.
 */
export function containerHideKey(container: ProviderResource) {
  return `${containerHostLabel(container)}::${container.name}`;
}

export function containerLabelPairs(container: ProviderResource) {
  return Object.entries(container.labels ?? {}).map(([key, value]) => `${key}=${value}`);
}

/** Everything a bare (unprefixed) search term is matched against. */
export function containerSearchHaystack(container: ProviderResource) {
  return [
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
}
