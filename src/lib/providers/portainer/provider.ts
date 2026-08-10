import { redactSecrets } from "@/lib/providers/credentials";
import {
  getPortainerContainerLogs,
  listPortainerEndpointContainers,
  listPortainerEndpoints,
  listPortainerStacks,
} from "@/lib/providers/portainer/client";
import {
  parsePortainerConfig,
  parsePortainerCredentials,
  validatePortainerConfig,
} from "@/lib/providers/portainer/config";
import {
  clearEndpointFailure,
  getEndpointCooldown,
  markEndpointFailure,
} from "@/lib/providers/portainer/endpoint-cooldown";
import {
  parsePortainerResourceId,
  portainerContainerToProviderResource,
  endpointHostFromPortainerEndpoint,
} from "@/lib/providers/portainer/normalize";
import {
  normalizePortainerEndpointStatus,
  portainerStackToResource,
} from "@/lib/providers/portainer/stack-normalize";
import {
  matchesPortainerStackContainer,
  portainerContainerToStackResource,
} from "@/lib/providers/portainer/stack-containers";
import {
  getCachedStackMembership,
  setCachedStackMembership,
} from "@/lib/providers/stack-membership-cache";
import type {
  ConnectionTestResult,
  ContainerLogsOptions,
  ContainerLogsResult,
  ListStackContainersResult,
  ListResourcesResult,
  ProviderContext,
  ProviderHandler,
  ProviderResource,
} from "@/lib/providers/types";

// Portainer EndpointType: 1 Docker, 2 Agent on Docker, 4 Edge Agent on Docker.
// Exclude Kubernetes (5/6/7) and Azure (3) — those are not Docker Engine gateways.
const DOCKER_ENDPOINT_TYPES = new Set([1, 2, 4]);

export function isPortainerDockerEndpoint(type: number | undefined) {
  return type !== undefined && DOCKER_ENDPOINT_TYPES.has(type);
}

export const portainerProviderHandler: ProviderHandler = {
  meta: {
    type: "portainer",
    name: "Portainer",
    description: "Read-only container status and logs through the Portainer API gateway.",
    capabilities: [
      "container.list",
      "container.status",
      "container.logs",
      "stack.list",
      "stack.status",
      "stack.containers",
    ],
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

    const skipped: string[] = [];
    const activeEndpoints = dockerEndpoints.filter((endpoint) => {
      const cooldown = getEndpointCooldown(context.provider.id, endpoint.Id);
      if (!cooldown) {
        return true;
      }
      const endpointName = endpoint.Name?.trim() || `Endpoint ${endpoint.Id}`;
      skipped.push(`${endpointName}: recently unreachable (${cooldown.message})`);
      return false;
    });

    const settled = await Promise.allSettled(
      activeEndpoints.map(async (endpoint) => {
        const containers = await listPortainerEndpointContainers(config, credentials, endpoint.Id);
        const endpointName = endpoint.Name?.trim() || `Endpoint ${endpoint.Id}`;
        const endpointHost = endpointHostFromPortainerEndpoint(endpoint);

        return {
          endpointId: endpoint.Id,
          resources: containers.map((item) =>
            portainerContainerToProviderResource({
              endpointId: endpoint.Id,
              endpointName,
              endpointHost,
              providerId: context.provider.id,
              item,
            })
          ),
        };
      })
    );

    const resources: ProviderResource[] = [];
    const failures: string[] = [];

    for (const [index, result] of settled.entries()) {
      const endpoint = activeEndpoints[index];
      if (!endpoint) {
        continue;
      }
      const endpointName = endpoint.Name?.trim() || `Endpoint ${endpoint.Id}`;

      if (result.status === "fulfilled") {
        clearEndpointFailure(context.provider.id, endpoint.Id);
        resources.push(...result.value.resources);
        continue;
      }

      const message = redactSecrets(
        result.reason instanceof Error ? result.reason.message : "Endpoint request failed."
      );
      markEndpointFailure(context.provider.id, endpoint.Id, message);
      failures.push(`${endpointName}: ${message}`);
    }

    const warnings = [...failures, ...skipped];

    if (resources.length === 0 && warnings.length > 0) {
      throw new Error(warnings.join(" "));
    }

    return {
      resources,
      warning: warnings.length > 0 ? warnings.join(" ") : undefined,
    };
  },

  async listStacks(context: ProviderContext) {
    const config = parsePortainerConfig(context.config);
    const credentials = parsePortainerCredentials(context.credentials);
    const validationError = validatePortainerConfig(config, credentials);
    if (validationError) {
      throw new Error(validationError);
    }

    const [endpoints, stacks] = await Promise.all([
      listPortainerEndpoints(config, credentials),
      listPortainerStacks(config, credentials),
    ]);
    const dockerEndpoints = new Map(
      endpoints
        .filter((endpoint) => isPortainerDockerEndpoint(endpoint.Type))
        .map((endpoint) => [
          endpoint.Id,
          {
            name: endpoint.Name?.trim() || `Endpoint ${endpoint.Id}`,
            status: normalizePortainerEndpointStatus(endpoint.Status),
          },
        ])
    );

    return {
      resources: stacks
        .filter((stack) => dockerEndpoints.has(stack.EndpointId))
        .map((stack) => {
          const endpoint = dockerEndpoints.get(stack.EndpointId);

          return portainerStackToResource({
            providerId: context.provider.id,
            providerName: context.provider.name,
            endpointName: endpoint?.name ?? `Endpoint ${stack.EndpointId}`,
            endpointStatus: endpoint?.status,
            item: stack,
          });
        }),
    };
  },

  async listStackContainers(
    context: ProviderContext,
    stackId: string,
    options: { bypassCache?: boolean } = {}
  ): Promise<ListStackContainersResult> {
    if (!/^[1-9]\d*$/.test(stackId)) {
      return { kind: "not_found", resources: [] };
    }
    const parsedStackId = Number(stackId);
    if (!Number.isSafeInteger(parsedStackId)) {
      return { kind: "not_found", resources: [] };
    }

    const config = parsePortainerConfig(context.config);
    const credentials = parsePortainerCredentials(context.credentials);
    const validationError = validatePortainerConfig(config, credentials);
    if (validationError) {
      throw new Error(validationError);
    }

    const [endpoints, stacks] = await Promise.all([
      listPortainerEndpoints(config, credentials),
      listPortainerStacks(config, credentials),
    ]);
    const stack = stacks.find((item) => item.Id === parsedStackId);
    const endpoint = endpoints.find(
      (item) => item.Id === stack?.EndpointId && isPortainerDockerEndpoint(item.Type)
    );
    if (!stack || !endpoint) {
      return { kind: "not_found", resources: [] };
    }

    const endpointStatus = normalizePortainerEndpointStatus(endpoint.Status);
    if (endpointStatus === "disconnected") {
      return { kind: "unavailable", reason: "endpoint_disconnected", resources: [] };
    }

    const stackResource = portainerStackToResource({
      providerId: context.provider.id,
      providerName: context.provider.name,
      endpointName: endpoint.Name?.trim() || `Endpoint ${endpoint.Id}`,
      endpointStatus,
      item: stack,
    });

    if (!options.bypassCache) {
      const cached = getCachedStackMembership(stackResource.id);
      if (cached) {
        return { kind: "ok", resources: cached.resources, cachedAt: cached.cachedAt };
      }
    }

    const containers = await listPortainerEndpointContainers(config, credentials, endpoint.Id);
    const resources = containers
      .filter((item) => matchesPortainerStackContainer(item, stackResource))
      .map((item) => portainerContainerToStackResource({ stack: stackResource, item }));
    setCachedStackMembership(stackResource.id, resources);

    return {
      kind: "ok",
      resources,
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
