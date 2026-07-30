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
import { decodeDockerLogResponse } from "@/lib/providers/docker/log-stream";

type PortainerEndpoint = {
  Id: number;
  Name?: string;
  URL?: string;
  PublicURL?: string;
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
  decodeLogs?: boolean;
  timeoutMs?: number;
};

export function getPortainerRequestTimeoutMs() {
  const configured = Number.parseInt(process.env.UH_PORTAINER_REQUEST_TIMEOUT_MS ?? "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 15_000;
}

export function getPortainerListTimeoutMs() {
  const configured = Number.parseInt(process.env.UH_PORTAINER_LIST_TIMEOUT_MS ?? "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 5_000;
}

/** Keep any reverse-proxy prefix from the base URL ahead of the API path. */
export function joinPortainerPath(basePathname: string, path: string) {
  const prefix = basePathname.replace(/\/+$/, "");
  if (!prefix) {
    return path;
  }

  return `${prefix}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Node's hostname option expects IPv6 literals without surrounding brackets. */
export function unbracketHostname(hostname: string) {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
}

export function buildPortainerRequestOptions({
  config,
  credentials,
  path,
  method = "GET",
}: PortainerRequestOptions): (http.RequestOptions | https.RequestOptions) & {
  protocol: string;
} {
  const baseUrl = new URL(config.baseUrl);
  const isHttps = baseUrl.protocol === "https:";

  const commonOptions: http.RequestOptions & { protocol: string } = {
    protocol: baseUrl.protocol,
    hostname: unbracketHostname(baseUrl.hostname),
    port: baseUrl.port ? Number.parseInt(baseUrl.port, 10) : isHttps ? 443 : 80,
    path: joinPortainerPath(baseUrl.pathname, path),
    method,
    headers: {
      Host: baseUrl.host,
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
    const transport = requestOptions.protocol === "https:" ? https.request : http.request;
    let settled = false;

    const finish = (error?: Error, value?: T) => {
      if (settled) {
        return;
      }
      settled = true;
      if (error) {
        reject(error);
        return;
      }
      resolve(value as T);
    };

    const request = transport(requestOptions, (response) => {
      const chunks: Buffer[] = [];

      response.on("data", (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      response.on("end", () => {
        const statusCode = response.statusCode ?? 500;
        const body = Buffer.concat(chunks);

        if (statusCode >= 400) {
          finish(new Error(body.toString("utf8") || `Portainer API returned ${statusCode}.`));
          return;
        }

        if (options.decodeLogs) {
          const contentType = Array.isArray(response.headers["content-type"])
            ? response.headers["content-type"][0]
            : response.headers["content-type"];
          finish(undefined, decodeDockerLogResponse(body, contentType ?? "") as T);
          return;
        }

        if (body.length === 0) {
          finish(undefined, undefined as T);
          return;
        }

        const text = body.toString("utf8");
        if (!text.trim()) {
          finish(undefined, undefined as T);
          return;
        }

        try {
          finish(undefined, JSON.parse(text) as T);
        } catch {
          finish(undefined, text as T);
        }
      });

      response.on("error", (error) => {
        finish(error);
      });
    });

    request.setTimeout(options.timeoutMs ?? getPortainerRequestTimeoutMs(), () => {
      finish(new Error("Portainer request timed out."));
      request.destroy();
    });

    request.on("error", (error) => {
      finish(error);
    });

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
    timeoutMs: getPortainerListTimeoutMs(),
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

  const logs = await portainerRequest<string>({
    config,
    credentials,
    path: `/api/endpoints/${endpointId}/docker/containers/${encodeURIComponent(containerId)}/logs?${params.toString()}`,
    decodeLogs: true,
  });

  return logs ?? "";
}

export type { DockerListItem, PortainerEndpoint };
