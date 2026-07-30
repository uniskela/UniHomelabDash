if (process.env.npm_lifecycle_event !== "test") {
  void import("server-only");
}

import http from "node:http";
import https from "node:https";
import type { DockerProviderConfig, DockerTlsCredentials } from "@/lib/providers/docker/config";
import { decodeDockerLogResponse } from "@/lib/providers/docker/log-stream";
import type { ContainerLogsOptions } from "@/lib/providers/types";

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

function dockerRequest<T>(
  options: DockerRequestOptions & { decodeLogs?: boolean }
): Promise<T> {
  return new Promise((resolve, reject) => {
    const requestOptions = buildRequestOptions(options);
    const transport =
      options.config.mode === "tls"
        ? https.request
        : http.request;

    const request = transport(requestOptions, (response) => {
      const chunks: Buffer[] = [];

      response.on("data", (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      response.on("end", () => {
        const statusCode = response.statusCode ?? 500;
        const body = Buffer.concat(chunks);

        if (statusCode >= 400) {
          reject(new Error(body.toString("utf8") || `Docker API returned ${statusCode}.`));
          return;
        }

        if (options.decodeLogs) {
          const contentType = Array.isArray(response.headers["content-type"])
            ? response.headers["content-type"][0]
            : response.headers["content-type"];
          resolve(decodeDockerLogResponse(body, contentType ?? "") as T);
          return;
        }

        if (body.length === 0) {
          resolve(undefined as T);
          return;
        }

        const text = body.toString("utf8");
        if (!text.trim()) {
          resolve(undefined as T);
          return;
        }

        try {
          resolve(JSON.parse(text) as T);
        } catch {
          resolve(text as T);
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

export async function getDockerContainerLogs(
  config: DockerProviderConfig,
  credentials: DockerTlsCredentials,
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

  const logs = await dockerRequest<string | undefined>({
    config,
    credentials,
    path: `/containers/${encodeURIComponent(containerId)}/logs?${params.toString()}`,
    decodeLogs: true,
  });

  return logs ?? "";
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
