if (process.env.npm_lifecycle_event !== "test") {
  void import("server-only");
}

import http from "node:http";
import https from "node:https";
import type { ContainerLogsOptions } from "@/lib/providers/types";
import type {
  PortainerCredentials,
  PortainerProviderConfig,
} from "@/lib/providers/portainer/config";

type PortainerEndpoint = {
  Id: number;
  Name?: string;
  URL?: string;
  Type?: number;
};

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

type PortainerRequestOptions = {
  config: PortainerProviderConfig;
  credentials: PortainerCredentials;
  path: string;
  method?: "GET" | "POST";
};

function buildPortainerRequestOptions({
  config,
  credentials,
  path,
  method = "GET",
}: PortainerRequestOptions): http.RequestOptions | https.RequestOptions {
  const baseUrl = new URL(config.baseUrl);
  const isHttps = baseUrl.protocol === "https:";

  const commonOptions: http.RequestOptions = {
    protocol: baseUrl.protocol,
    hostname: baseUrl.hostname,
    port: baseUrl.port ? Number.parseInt(baseUrl.port, 10) : isHttps ? 443 : 80,
    path,
    method,
    headers: {
      Host: baseUrl.hostname,
      "X-API-Key": credentials.apiKey ?? "",
    },
  };

  if (!isHttps) {
    return commonOptions;
  }

  return {
    ...commonOptions,
    ca: credentials.caCert,
    rejectUnauthorized: true,
  };
}

function portainerRequest<T>(options: PortainerRequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const requestOptions = buildPortainerRequestOptions(options);
    const transport = options.config.baseUrl.startsWith("https://") ? https.request : http.request;

    const request = transport(requestOptions, (response) => {
      let body = "";

      response.on("data", (chunk: Buffer | string) => {
        body += chunk.toString();
      });

      response.on("end", () => {
        const statusCode = response.statusCode ?? 500;
        if (statusCode >= 400) {
          reject(new Error(body || `Portainer API returned ${statusCode}.`));
          return;
        }

        if (!body.trim()) {
          resolve(undefined as T);
          return;
        }

        try {
          resolve(JSON.parse(body) as T);
        } catch {
          resolve(body as T);
        }
      });
    });

    request.on("error", reject);
    request.end();
  });
}

export async function listPortainerEndpoints(
  config: PortainerProviderConfig,
  credentials: PortainerCredentials
) {
  return portainerRequest<PortainerEndpoint[]>({
    config,
    credentials,
    path: "/api/endpoints",
  });
}

export async function listPortainerEndpointContainers(
  config: PortainerProviderConfig,
  credentials: PortainerCredentials,
  endpointId: number
) {
  return portainerRequest<DockerListItem[]>({
    config,
    credentials,
    path: `/api/endpoints/${endpointId}/docker/containers/json?all=1`,
  });
}

export async function getPortainerContainerLogs(
  config: PortainerProviderConfig,
  credentials: PortainerCredentials,
  endpointId: number,
  containerId: string,
  options: ContainerLogsOptions = {}
) {
  const tail = Number.isFinite(options.tail) ? Math.max(1, Math.trunc(options.tail ?? 200)) : 200;
  const timestamps = options.timestamps ?? true;
  const params = new URLSearchParams({
    stdout: "1",
    stderr: "1",
    tail: String(tail),
    timestamps: timestamps ? "1" : "0",
  });

  const logs = await portainerRequest<string | undefined>({
    config,
    credentials,
    path: `/api/endpoints/${endpointId}/docker/containers/${encodeURIComponent(containerId)}/logs?${params.toString()}`,
  });

  return logs ?? "";
}

export type { DockerListItem, PortainerEndpoint };
