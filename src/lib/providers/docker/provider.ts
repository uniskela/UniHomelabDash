import { redactSecrets } from "@/lib/providers/credentials";
import {
  listDockerContainers,
  parseDockerConfig,
  pingDocker,
} from "@/lib/providers/docker/client";
import {
  containerResourceToProviderResource,
  normalizeDockerListItem,
} from "@/lib/providers/docker/normalize";
import type {
  ConnectionTestResult,
  ProviderContext,
  ProviderHandler,
  ProviderResource,
} from "@/lib/providers/types";

export const dockerProviderHandler: ProviderHandler = {
  meta: {
    type: "docker",
    name: "Docker",
    description: "Read-only container status from a local Docker Engine socket.",
    capabilities: ["container.list", "container.status"],
    supportsCredentials: false,
  },

  async testConnection(context: ProviderContext): Promise<ConnectionTestResult> {
    if (context.provider.readOnly !== true) {
      return { ok: false, message: "Docker provider must stay read-only in this release." };
    }

    const config = parseDockerConfig(context.config);

    try {
      const details = await pingDocker(config);
      return {
        ok: true,
        message: "Connected to Docker Engine.",
        details,
      };
    } catch (error) {
      return {
        ok: false,
        message: redactSecrets(
          error instanceof Error
            ? error.message
            : "Could not reach Docker. Mount the socket and enable the integration in Settings."
        ),
      };
    }
  },

  async listResources(context: ProviderContext): Promise<ProviderResource[]> {
    const config = parseDockerConfig(context.config);
    const containers = await listDockerContainers(config);

    return containers.map((item) =>
      containerResourceToProviderResource(
        normalizeDockerListItem(item),
        context.provider.id
      )
    );
  },

  async executeAction() {
    return {
      ok: false,
      message: "Docker actions are not available in read-only mode.",
    };
  },
};
