import { redactSecrets } from "@/lib/providers/credentials";
import {
  getPortainerContainerLogs,
  listPortainerEndpointContainers,
  listPortainerEndpoints,
} from "@/lib/providers/portainer/client";
import {
  parsePortainerConfig,
  parsePortainerCredentials,
  validatePortainerConfig,
} from "@/lib/providers/portainer/config";
import {
  parsePortainerResourceId,
  portainerContainerToProviderResource,
} from "@/lib/providers/portainer/normalize";
import type {
  ConnectionTestResult,
  ContainerLogsOptions,
  ContainerLogsResult,
  ListResourcesResult,
  ProviderContext,
  ProviderHandler,
  ProviderResource,
} from "@/lib/providers/types";

// Portainer EndpointType: 1 Docker, 2 Agent on Docker, 4 Edge Agent on Docker.
// Exclude Kubernetes (5/6/7) and Azure (3) — those are not Docker Engine gateways.
const DOCKER_ENDPOINT_TYPES = new Set([1, 2, 4]);

export function isPortainerDockerEndpoint(type: number | undefined) {
  if (type === undefined) {
    return true;
  }
  return DOCKER_ENDPOINT_TYPES.has(type);
}

export const portainerProviderHandler: ProviderHandler = {
  meta: {
    type: "portainer",
    name: "Portainer",
    description: "Read-only container status and logs through the Portainer API gateway.",
    capabilities: ["container.list", "container.status", "container.logs"],
    supportsCredentials: true,
  },

  async testConnection(context: ProviderContext): Promise<ConnectionTestResult> {
    const config = parsePortainerConfig(context.config);
    const credentials = parsePortainerCredentials(context.credentials);
    const validationError = validatePortainerConfig(config, credentials);

    if (validationError) {
      return { ok: false, message: validationError };
    }

    try {
      const endpoints = await listPortainerEndpoints(config, credentials);
      const dockerEndpoints = endpoints.filter((endpoint) =>
        isPortainerDockerEndpoint(endpoint.Type)
      );

      return {
        ok: true,
        message: "Connected to Portainer.",
        details: {
          endpoints: String(endpoints.length),
          dockerEndpoints: String(dockerEndpoints.length),
        },
      };
    } catch (error) {
      return {
        ok: false,
        message: redactSecrets(
          error instanceof Error ? error.message : "Could not reach Portainer."
        ),
      };
    }
  },

  async listResources(context: ProviderContext): Promise<ListResourcesResult> {
    const config = parsePortainerConfig(context.config);
    const credentials = parsePortainerCredentials(context.credentials);
    const validationError = validatePortainerConfig(config, credentials);
    if (validationError) {
      throw new Error(validationError);
    }

    const endpoints = await listPortainerEndpoints(config, credentials);
    const dockerEndpoints = endpoints.filter((endpoint) =>
      isPortainerDockerEndpoint(endpoint.Type)
    );

    const settled = await Promise.allSettled(
      dockerEndpoints.map(async (endpoint) => {
        const containers = await listPortainerEndpointContainers(config, credentials, endpoint.Id);
        const endpointName = endpoint.Name?.trim() || `Endpoint ${endpoint.Id}`;

        return containers.map((item) =>
          portainerContainerToProviderResource({
            endpointId: endpoint.Id,
            endpointName,
            providerId: context.provider.id,
            item,
          })
        );
      })
    );

    const resources: ProviderResource[] = [];
    const failures: string[] = [];

    for (const [index, result] of settled.entries()) {
      if (result.status === "fulfilled") {
        resources.push(...result.value);
        continue;
      }
      const endpointName =
        dockerEndpoints[index]?.Name?.trim() || `Endpoint ${dockerEndpoints[index]?.Id ?? "?"}`;
      failures.push(
        `${endpointName}: ${redactSecrets(
          result.reason instanceof Error ? result.reason.message : "Endpoint request failed."
        )}`
      );
    }

    if (resources.length === 0 && failures.length > 0) {
      throw new Error(failures.join(" "));
    }

    return {
      resources,
      warning: failures.length > 0 ? failures.join(" ") : undefined,
    };
  },

  async getLogs(
    context: ProviderContext,
    resourceId: string,
    options: ContainerLogsOptions = {}
  ): Promise<ContainerLogsResult> {
    const config = parsePortainerConfig(context.config);
    const credentials = parsePortainerCredentials(context.credentials);
    const validationError = validatePortainerConfig(config, credentials);
    if (validationError) {
      return { ok: false, logs: "", message: validationError };
    }

    const parsedResource = parsePortainerResourceId(resourceId);
    if (!parsedResource) {
      return {
        ok: false,
        logs: "",
        message: "Invalid Portainer container reference.",
      };
    }

    try {
      const logs = await getPortainerContainerLogs(
        config,
        credentials,
        parsedResource.endpointId,
        parsedResource.containerId,
        options
      );
      return { ok: true, logs: redactSecrets(logs) };
    } catch (error) {
      return {
        ok: false,
        logs: "",
        message: redactSecrets(
          error instanceof Error ? error.message : "Failed to load container logs."
        ),
      };
    }
  },
};
