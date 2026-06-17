import "server-only";
import http from "node:http";
import https from "node:https";
import type { DockerProviderConfig, DockerTlsCredentials } from "@/lib/providers/docker/config";

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

type DockerRequestOptions = {
  config: DockerProviderConfig;
  credentials: DockerTlsCredentials;
  path: string;
  method?: "GET" | "POST";
};

function buildRequestOptions({
  config,
  credentials,
  path,
  method = "GET",
}: DockerRequestOptions): http.RequestOptions | https.RequestOptions {
  if (config.mode === "local") {
    return {
      socketPath: config.socketPath,
      path,
      method,
      headers: {
        Host: "localhost",
      },
    };
  }

  const remoteBase: http.RequestOptions = {
    hostname: config.host,
    port: config.port,
    path,
    method,
    headers: {
      Host: config.host,
    },
  };

  if (config.mode === "tls") {
    return {
      ...remoteBase,
      ca: credentials.ca,
      cert: credentials.cert,
      key: credentials.key,
      rejectUnauthorized: true,
    };
  }

  return remoteBase;
}

function dockerRequest<T>(options: DockerRequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const requestOptions = buildRequestOptions(options);
    const transport =
      options.config.mode === "tls"
        ? https.request
        : http.request;

    const request = transport(requestOptions, (response) => {
      let body = "";

      response.on("data", (chunk: Buffer | string) => {
        body += chunk.toString();
      });

      response.on("end", () => {
        const statusCode = response.statusCode ?? 500;
        if (statusCode >= 400) {
          reject(new Error(body || `Docker API returned ${statusCode}.`));
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

export async function pingDocker(
  config: DockerProviderConfig,
  credentials: DockerTlsCredentials = {}
) {
  const version = await dockerRequest<{ ApiVersion?: string; Version?: string }>({
    config,
    credentials,
    path: "/version",
  });

  return {
    apiVersion: String(version.ApiVersion ?? ""),
    dockerVersion: String(version.Version ?? ""),
  };
}

export async function listDockerContainers(
  config: DockerProviderConfig,
  credentials: DockerTlsCredentials = {}
) {
  return dockerRequest<DockerListItem[]>({
    config,
    credentials,
    path: "/containers/json?all=1",
  });
}

export async function runDockerContainerAction(
  config: DockerProviderConfig,
  credentials: DockerTlsCredentials,
  containerId: string,
  action: "start" | "stop" | "restart"
) {
  await dockerRequest({
    config,
    credentials,
    path: `/containers/${encodeURIComponent(containerId)}/${action}`,
    method: "POST",
  });
}

export type { DockerListItem };
