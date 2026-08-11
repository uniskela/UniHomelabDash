import { redactSecrets } from "@/lib/providers/credentials";
import {
  getDockerContainerLogs,
  getDockerContainerStats,
  inspectDockerContainer,
  listDockerContainers,
  pingDocker,
  runDockerContainerAction,
} from "@/lib/providers/docker/client";
import {
  parseDockerConfig,
  parseDockerCredentials,
  validateDockerConfig,
  type DockerContainerAction,
} from "@/lib/providers/docker/config";
import {
  isStatsUnavailableState,
  normalizeDockerInspect,
} from "@/lib/providers/docker/inspect-normalize";
import {
  containerResourceToProviderResource,
  normalizeDockerListItem,
} from "@/lib/providers/docker/normalize";
import { normalizeDockerStats } from "@/lib/providers/docker/stats-normalize";
import type {
  ConnectionTestResult,
  ContainerDetailResult,
  ContainerLogsOptions,
  ContainerLogsResult,
  ContainerStatsResult,
  ListResourcesResult,
  ProviderContext,
  ProviderHandler,
} from "@/lib/providers/types";

const DOCKER_ACTIONS = new Set<DockerContainerAction>(["start", "stop", "restart"]);

function classifyDockerError(error: unknown): ContainerDetailResult | ContainerStatsResult {
  const message = redactSecrets(
    error instanceof Error ? error.message : "Docker request failed."
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

export const dockerProviderHandler: ProviderHandler = {
  meta: {
    type: "docker",
    name: "Docker",
    description:
      "Container status, logs, inspect, stats, and safe start/stop/restart actions for Docker Engine.",
    capabilities: [
      "container.list",
      "container.status",
      "container.logs",
      "container.inspect",
      "container.stats",
      "container.start",
      "container.stop",
      "container.restart",
    ],
    supportsCredentials: true,
  },

  async testConnection(context: ProviderContext): Promise<ConnectionTestResult> {
    const config = parseDockerConfig(context.config);
    const credentials = parseDockerCredentials(context.credentials);
    const validationError = validateDockerConfig(config, credentials);

    if (validationError) {
      return { ok: false, message: validationError };
    }

    try {
      const details = await pingDocker(config, credentials);
      return {
        ok: true,
        message: "Connected to Docker Engine.",
        details: {
          mode: config.mode,
          ...details,
        },
      };
    } catch (error) {
      return {
        ok: false,
        message: redactSecrets(
          error instanceof Error
            ? error.message
            : "Could not reach Docker. Check your connection settings."
        ),
      };
    }
  },

  async listResources(context: ProviderContext): Promise<ListResourcesResult> {
    const config = parseDockerConfig(context.config);
    const credentials = parseDockerCredentials(context.credentials);
    const containers = await listDockerContainers(config, credentials);

    return {
      resources: containers.map((item) =>
        containerResourceToProviderResource(
          normalizeDockerListItem(item),
          context.provider.id
        )
      ),
    };
  },

  async getLogs(
    context: ProviderContext,
    resourceId: string,
    options: ContainerLogsOptions = {}
  ): Promise<ContainerLogsResult> {
    const config = parseDockerConfig(context.config);
    const credentials = parseDockerCredentials(context.credentials);
    const validationError = validateDockerConfig(config, credentials);

    if (validationError) {
      return { ok: false, logs: "", message: validationError };
    }

    try {
      const logs = await getDockerContainerLogs(config, credentials, resourceId, options);
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
    const config = parseDockerConfig(context.config);
    const credentials = parseDockerCredentials(context.credentials);
    const validationError = validateDockerConfig(config, credentials);
    if (validationError) {
      return { kind: "error", reason: "malformed", message: validationError };
    }

    try {
      const payload = await inspectDockerContainer(config, credentials, resourceId);
      const detail = normalizeDockerInspect({
        payload,
        providerId: context.provider.id,
        providerType: "docker",
        resourceId,
        meta: {
          providerName: context.provider.name,
          providerReadOnly: String(context.provider.readOnly),
        },
      });
      if (!detail) {
        return {
          kind: "error",
          reason: "malformed",
          message: "Docker returned an invalid inspect payload.",
        };
      }
      return { kind: "ok", detail };
    } catch (error) {
      return classifyDockerError(error) as ContainerDetailResult;
    }
  },

  async getContainerStats(
    context: ProviderContext,
    resourceId: string
  ): Promise<ContainerStatsResult> {
    const config = parseDockerConfig(context.config);
    const credentials = parseDockerCredentials(context.credentials);
    const validationError = validateDockerConfig(config, credentials);
    if (validationError) {
      return { kind: "error", reason: "malformed", message: validationError };
    }

    try {
      try {
        const inspect = await inspectDockerContainer(config, credentials, resourceId);
        const state =
          inspect && typeof inspect === "object"
            ? (inspect as { State?: { Status?: string } }).State?.Status
            : undefined;
        if (isStatsUnavailableState(state)) {
          return {
            kind: "unavailable",
            reason: "stopped",
            message: "Resource statistics are unavailable while the container is not running.",
          };
        }
      } catch (error) {
        return classifyDockerError(error) as ContainerStatsResult;
      }

      const payload = await getDockerContainerStats(config, credentials, resourceId);
      const stats = normalizeDockerStats(payload);
      if (!stats) {
        return {
          kind: "error",
          reason: "malformed",
          message: "Docker returned an invalid stats payload.",
        };
      }
      return { kind: "ok", stats };
    } catch (error) {
      return classifyDockerError(error) as ContainerStatsResult;
    }
  },

  async executeAction(context: ProviderContext, action: string, resourceId: string) {
    if (context.provider.readOnly) {
      return {
        ok: false,
        message: "Container actions are disabled. Enable them in Settings -> Integrations.",
      };
    }

    if (!DOCKER_ACTIONS.has(action as DockerContainerAction)) {
      return { ok: false, message: "Unsupported container action." };
    }

    const config = parseDockerConfig(context.config);
    const credentials = parseDockerCredentials(context.credentials);
    const validationError = validateDockerConfig(config, credentials);

    if (validationError) {
      return { ok: false, message: validationError };
    }

    try {
      await runDockerContainerAction(
        config,
        credentials,
        resourceId,
        action as DockerContainerAction
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
