import {
  containerResourceToProviderResource,
  normalizeDockerListItem,
} from "@/lib/providers/docker/normalize";
import type { ProviderResource } from "@/lib/providers/types";
import type { DockerListItem } from "@/lib/providers/portainer/client";

const COMPOSITE_DELIMITER = ":";

export function buildPortainerResourceId(endpointId: number, containerId: string) {
  return `${endpointId}${COMPOSITE_DELIMITER}${containerId}`;
}

export function parsePortainerResourceId(resourceId: string) {
  const [endpointRaw, ...containerParts] = resourceId.split(COMPOSITE_DELIMITER);
  const endpointId = Number.parseInt(endpointRaw ?? "", 10);
  const containerId = containerParts.join(COMPOSITE_DELIMITER);

  if (!Number.isFinite(endpointId) || endpointId <= 0 || !containerId.trim()) {
    return null;
  }

  return { endpointId, containerId };
}

/** Prefer PublicURL, then a tcp/http(s) endpoint URL host. Skip unix/npipe sockets. */
export function endpointHostFromPortainerEndpoint(endpoint: {
  URL?: string;
  PublicURL?: string;
}): string | undefined {
  const publicUrl = endpoint.PublicURL?.trim();
  if (publicUrl) {
    const fromPublic = hostFromMaybeUrl(publicUrl);
    if (fromPublic) {
      return fromPublic;
    }
  }

  const url = endpoint.URL?.trim();
  if (!url || url.startsWith("unix:") || url.startsWith("npipe:")) {
    return undefined;
  }

  return hostFromMaybeUrl(url);
}

function hostFromMaybeUrl(value: string): string | undefined {
  try {
    const parsed = new URL(value.includes("://") ? value : `tcp://${value}`);
    return parsed.hostname || undefined;
  } catch {
    return undefined;
  }
}

export function portainerContainerToProviderResource(input: {
  endpointId: number;
  endpointName: string;
  endpointHost?: string;
  providerId: string;
  item: DockerListItem;
}): ProviderResource {
  const normalized = normalizeDockerListItem(input.item);
  const containerResource = containerResourceToProviderResource(normalized, input.providerId);

  return {
    ...containerResource,
    id: buildPortainerResourceId(input.endpointId, normalized.id),
    providerType: "portainer",
    meta: {
      endpointId: String(input.endpointId),
      endpointName: input.endpointName,
      ...(input.endpointHost ? { providerHost: input.endpointHost } : {}),
    },
  };
}
