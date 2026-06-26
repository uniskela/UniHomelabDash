import { redactSecrets } from "@/lib/providers/credentials";
import {
  getDockerContainerLogs,
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
  containerResourceToProviderResource,
  normalizeDockerListItem,
} from "@/lib/providers/docker/normalize";
import type {
  ConnectionTestResult,
  ContainerLogsOptions,
  ContainerLogsResult,
  ProviderContext,
  ProviderHandler,
  ProviderResource,
} from "@/lib/providers/types";

const DOCKER_ACTIONS = new Set<DockerContainerAction>(["start", "stop", "restart"]);

export const dockerProviderHandler: ProviderHandler = {
  meta: {
    type: "docker",
    name: "Docker",
    description: "Container status, logs, and safe start/stop/restart actions for Docker Engine.",
    capabilities: [
      "container.list",
      "container.status",
      "container.logs",
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

  async listResources(context: ProviderContext): Promise<ProviderResource[]> {
    const config = parseDockerConfig(context.config);
    const credentials = parseDockerCredentials(context.credentials);
    const containers = await listDockerContainers(config, credentials);

    return containers.map((item) =>
      containerResourceToProviderResource(
        normalizeDockerListItem(item),
        context.provider.id
      )
    );
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
