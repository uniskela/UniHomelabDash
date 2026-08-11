import { redactSecrets } from "@/lib/providers/credentials";
import {
  isStatsUnavailableState,
  normalizeDockerInspect,
} from "@/lib/providers/docker/inspect-normalize";
import { normalizeContainerState } from "@/lib/providers/docker/normalize";
import { normalizeDockerStats } from "@/lib/providers/docker/stats-normalize";
import {
  getPortainerContainerLogs,
  getPortainerContainerStats,
  inspectPortainerContainer,
  listPortainerEndpointContainers,
  listPortainerEndpoints,
  listPortainerStacks,
  runPortainerContainerAction,
  type PortainerEndpoint,
} from "@/lib/providers/portainer/client";
import {
  parsePortainerConfig,
  parsePortainerCredentials,
  validatePortainerConfig,
  type PortainerCredentials,
  type PortainerProviderConfig,
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
  ContainerDetailResult,
  ContainerLogsOptions,
  ContainerLogsResult,
  ContainerStatsResult,
  ListStackContainersResult,
  ListResourcesResult,
  ProviderContext,
  ProviderHandler,
  ProviderResource,
} from "@/lib/providers/types";

// Portainer EndpointType: 1 Docker, 2 Agent on Docker, 4 Edge Agent on Docker.
// Exclude Kubernetes (5/6/7) and Azure (3) — those are not Docker Engine gateways.
const DOCKER_ENDPOINT_TYPES = new Set([1, 2, 4]);
type PortainerContainerAction = "start" | "stop" | "restart";
const PORTAINER_ACTIONS = new Set<PortainerContainerAction>(["start", "stop", "restart"]);

export function isPortainerDockerEndpoint(type: number | undefined) {
  return type !== undefined && DOCKER_ENDPOINT_TYPES.has(type);
}

function classifyPortainerError(error: unknown): ContainerDetailResult | ContainerStatsResult {
  const message = redactSecrets(
    error instanceof Error ? error.message : "Portainer request failed."
  );
  const lower = message.toLowerCase();

  if (lower.includes("no such container") || lower.includes("404")) {
    return { kind: "not_found", message: "Container not found." };
  }
  if (lower.includes("timed out") || lower.includes("timeout")) {
    return { kind: "error", reason: "timeout", message };
  }
  if (lower.includes("is not running") || lower.includes("container is not running")) {
    return {
      kind: "unavailable",
      reason: "stopped",
      message: "Container is not running.",
    };
  }

  return { kind: "error", reason: "malformed", message };
}

function endpointDisplayName(endpoint: PortainerEndpoint) {
  return endpoint.Name?.trim() || `Endpoint ${endpoint.Id}`;
}

async function resolveDockerEndpoint(input: {
  config: PortainerProviderConfig;
  credentials: PortainerCredentials;
  endpointId: number;
}): Promise<
  | { kind: "ok"; endpoint: PortainerEndpoint }
  | { kind: "not_found"; message: string }
  | { kind: "unavailable"; reason: "endpoint_disconnected"; message: string }
> {
  const endpoints = await listPortainerEndpoints(input.config, input.credentials);
  const endpoint = endpoints.find(
    (item) => item.Id === input.endpointId && isPortainerDockerEndpoint(item.Type)
  );
  if (!endpoint) {
    return { kind: "not_found", message: "Portainer endpoint not found." };
  }

  if (normalizePortainerEndpointStatus(endpoint.Status) === "disconnected") {
    return {
      kind: "unavailable",
      reason: "endpoint_disconnected",
      message: `${endpointDisplayName(endpoint)} is disconnected.`,
    };
  }

  return { kind: "ok", endpoint };
}

function inspectStateStatus(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  return (payload as { State?: { Status?: string } }).State?.Status;
}

function validatePortainerAction(
  action: PortainerContainerAction,
  state: string | undefined
): string | null {
  const normalized = normalizeContainerState(state);

  if (action === "start") {
    if (normalized === "paused") {
      return "Cannot start a paused container. Unpause it first outside UniHomelabDash.";
    }
    if (normalized === "exited" || normalized === "dead" || normalized === "created") {
      return null;
    }
    if (normalized === "running") {
      return "Container is already running.";
    }
    return `Cannot start a container in the "${normalized}" state.`;
  }

  if (action === "stop" || action === "restart") {
    if (normalized === "running") {
      return null;
    }
    return `Cannot ${action} a container that is not running (current state: ${normalized}).`;
  }

  return "Unsupported container action.";
}

export const portainerProviderHandler: ProviderHandler = {
  meta: {
    type: "portainer",
    name: "Portainer",
    description:
      "Container status, logs, inspect, stats, and optional start/stop/restart through the Portainer API gateway. Actions remain disabled by default (read-only).",
    capabilities: [
      "container.list",
      "container.status",
      "container.logs",
      "container.inspect",
      "container.stats",
      "container.start",
      "container.stop",
      "container.restart",
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

  async inspectContainer(
    context: ProviderContext,
    resourceId: string
  ): Promise<ContainerDetailResult> {
    const config = parsePortainerConfig(context.config);
    const credentials = parsePortainerCredentials(context.credentials);
    const validationError = validatePortainerConfig(config, credentials);
    if (validationError) {
      return { kind: "error", reason: "malformed", message: validationError };
    }

    const parsedResource = parsePortainerResourceId(resourceId);
    if (!parsedResource) {
      return {
        kind: "error",
        reason: "malformed",
        message: "Invalid Portainer container reference.",
      };
    }

    try {
      const resolved = await resolveDockerEndpoint({
        config,
        credentials,
        endpointId: parsedResource.endpointId,
      });
      if (resolved.kind !== "ok") {
        return resolved;
      }

      const payload = await inspectPortainerContainer(
        config,
        credentials,
        parsedResource.endpointId,
        parsedResource.containerId
      );
      const detail = normalizeDockerInspect({
        payload,
        providerId: context.provider.id,
        providerType: "portainer",
        resourceId,
        meta: {
          endpointId: String(resolved.endpoint.Id),
          endpointName: endpointDisplayName(resolved.endpoint),
          providerName: context.provider.name,
          providerReadOnly: String(context.provider.readOnly),
        },
      });
      if (!detail) {
        return {
          kind: "error",
          reason: "malformed",
          message: "Portainer returned an invalid inspect payload.",
        };
      }
      return { kind: "ok", detail };
    } catch (error) {
      return classifyPortainerError(error) as ContainerDetailResult;
    }
  },

  async getContainerStats(
    context: ProviderContext,
    resourceId: string
  ): Promise<ContainerStatsResult> {
    const config = parsePortainerConfig(context.config);
    const credentials = parsePortainerCredentials(context.credentials);
    const validationError = validatePortainerConfig(config, credentials);
    if (validationError) {
      return { kind: "error", reason: "malformed", message: validationError };
    }

    const parsedResource = parsePortainerResourceId(resourceId);
    if (!parsedResource) {
      return {
        kind: "error",
        reason: "malformed",
        message: "Invalid Portainer container reference.",
      };
    }

    try {
      const resolved = await resolveDockerEndpoint({
        config,
        credentials,
        endpointId: parsedResource.endpointId,
      });
      if (resolved.kind !== "ok") {
        return resolved;
      }

      try {
        const inspect = await inspectPortainerContainer(
          config,
          credentials,
          parsedResource.endpointId,
          parsedResource.containerId
        );
        if (isStatsUnavailableState(inspectStateStatus(inspect))) {
          return {
            kind: "unavailable",
            reason: "stopped",
            message: "Resource statistics are unavailable while the container is not running.",
          };
        }
      } catch (error) {
        return classifyPortainerError(error) as ContainerStatsResult;
      }

      const payload = await getPortainerContainerStats(
        config,
        credentials,
        parsedResource.endpointId,
        parsedResource.containerId
      );
      const stats = normalizeDockerStats(payload);
      if (!stats) {
        return {
          kind: "error",
          reason: "malformed",
          message: "Portainer returned an invalid stats payload.",
        };
      }
      return { kind: "ok", stats };
    } catch (error) {
      return classifyPortainerError(error) as ContainerStatsResult;
    }
  },

  async executeAction(context: ProviderContext, action: string, resourceId: string) {
    if (context.provider.readOnly) {
      return {
        ok: false,
        message: "Container actions are disabled. Enable them in Settings -> Integrations.",
      };
    }

    if (!PORTAINER_ACTIONS.has(action as PortainerContainerAction)) {
      return { ok: false, message: "Unsupported container action." };
    }

    const config = parsePortainerConfig(context.config);
    const credentials = parsePortainerCredentials(context.credentials);
    const validationError = validatePortainerConfig(config, credentials);
    if (validationError) {
      return { ok: false, message: validationError };
    }

    const parsedResource = parsePortainerResourceId(resourceId);
    if (!parsedResource) {
      return { ok: false, message: "Invalid Portainer container reference." };
    }

    try {
      const resolved = await resolveDockerEndpoint({
        config,
        credentials,
        endpointId: parsedResource.endpointId,
      });
      if (resolved.kind === "not_found") {
        return { ok: false, message: resolved.message };
      }
      if (resolved.kind === "unavailable") {
        return { ok: false, message: resolved.message };
      }

      const inspect = await inspectPortainerContainer(
        config,
        credentials,
        parsedResource.endpointId,
        parsedResource.containerId
      );
      const stateError = validatePortainerAction(
        action as PortainerContainerAction,
        inspectStateStatus(inspect)
      );
      if (stateError) {
        return { ok: false, message: stateError };
      }

      await runPortainerContainerAction(
        config,
        credentials,
        parsedResource.endpointId,
        parsedResource.containerId,
        action as PortainerContainerAction
      );
      return {
        ok: true,
        message: `Container ${action} requested successfully.`,
      };
    } catch (error) {
      return {
        ok: false,
        message: redactSecrets(
          error instanceof Error ? error.message : `Failed to ${action} container.`
        ),
      };
    }
  },
};
