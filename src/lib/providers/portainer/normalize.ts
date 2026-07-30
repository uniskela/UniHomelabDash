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

export function portainerContainerToProviderResource(input: {
  endpointId: number;
  endpointName: string;
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
    },
  };
}
