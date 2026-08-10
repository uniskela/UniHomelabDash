import { normalizeDockerListItem } from "@/lib/providers/docker/normalize";
import { buildPortainerResourceId } from "@/lib/providers/portainer/normalize";
import type { DockerListItem } from "@/lib/providers/portainer/client";
import type { StackContainerResource, StackResource } from "@/lib/providers/types";

type StackContainerItem = DockerListItem & Record<string, unknown>;

export function matchesPortainerStackContainer(item: StackContainerItem, stack: StackResource) {
  const compose = item.Labels?.["com.docker.compose.project"];
  const swarm = item.Labels?.["com.docker.stack.namespace"];

  if (stack.type === "Compose") return compose === stack.name;
  if (stack.type === "Swarm") return swarm === stack.name;
  return compose === stack.name || swarm === stack.name;
}

export function portainerContainerToStackResource(input: {
  stack: StackResource;
  item: StackContainerItem;
}): StackContainerResource {
  const normalized = normalizeDockerListItem(input.item);

  return {
    id: buildPortainerResourceId(input.stack.endpointId, normalized.id),
    name: normalized.name,
    state: normalized.state,
    status: normalized.status,
    image: normalized.image,
    ports: normalized.ports,
    ...(normalized.createdAt ? { createdAt: normalized.createdAt } : {}),
    providerId: input.stack.providerId,
    providerName: input.stack.providerName,
    endpointId: input.stack.endpointId,
    endpointName: input.stack.endpointName,
  };
}
