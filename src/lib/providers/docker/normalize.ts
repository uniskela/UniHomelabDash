import type { ContainerResource, ContainerState } from "@/lib/providers/types";

type DockerListItem = {
  Id: string;
  Names?: string[];
  Image?: string;
  State?: string;
  Status?: string;
  Created?: number;
  Labels?: Record<string, string>;
  Ports?: Array<{
    PrivatePort?: number;
    PublicPort?: number;
    Type?: string;
  }>;
};

export function normalizeContainerName(names: string[] | undefined) {
  const raw = names?.[0] ?? "";
  return raw.replace(/^\//, "") || "unknown";
}

export function normalizeContainerState(state: string | undefined): ContainerState {
  switch ((state ?? "").toLowerCase()) {
    case "running":
      return "running";
    case "paused":
      return "paused";
    case "restarting":
      return "restarting";
    case "exited":
      return "exited";
    case "dead":
      return "dead";
    case "created":
      return "created";
    default:
      return "unknown";
  }
}

type DockerPortBinding = {
  HostIp?: string;
  HostPort?: string;
};

type DockerPortMap = Record<string, DockerPortBinding[] | null>;

export function formatContainerPorts(
  ports: DockerListItem["Ports"] | DockerPortMap
) {
  if (!ports) {
    return [] as string[];
  }

  if (Array.isArray(ports)) {
    return ports
      .filter((port) => port.PrivatePort)
      .map((port) => {
        if (port.PublicPort) {
          return `${port.PublicPort}:${port.PrivatePort}/${port.Type ?? "tcp"}`;
        }
        return `${port.PrivatePort}/${port.Type ?? "tcp"}`;
      });
  }

  return Object.entries(ports).flatMap(([containerPort, bindings]) => {
    if (!bindings?.length) {
      return [containerPort];
    }

    return bindings.map((binding) => {
      const host = binding.HostIp ? `${binding.HostIp}:` : "";
      return `${host}${binding.HostPort}->${containerPort}`;
    });
  });
}

export function normalizeDockerListItem(item: DockerListItem): ContainerResource {
  return {
    id: item.Id,
    name: normalizeContainerName(item.Names),
    image: item.Image ?? "unknown",
    state: normalizeContainerState(item.State),
    status: item.Status ?? item.State ?? "unknown",
    ports: formatContainerPorts(item.Ports),
    createdAt: item.Created ? new Date(item.Created * 1000).toISOString() : "",
    labels: item.Labels ?? {},
  };
}

export function containerResourceToProviderResource(
  container: ContainerResource,
  providerId: string
) {
  return {
    id: container.id,
    kind: "container" as const,
    name: container.name,
    status: container.state,
    summary: container.status,
    image: container.image,
    ports: container.ports,
    createdAt: container.createdAt,
    labels: container.labels,
    providerType: "docker" as const,
    providerId,
  };
}
