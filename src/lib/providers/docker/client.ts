import "server-only";
import http from "node:http";
import type { DockerProviderConfig } from "@/lib/providers/types";

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

function dockerRequest<T>(config: DockerProviderConfig, path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        socketPath: config.socketPath,
        path,
        method: "GET",
        headers: {
          Host: "localhost",
        },
      },
      (response) => {
        let body = "";

        response.on("data", (chunk: Buffer | string) => {
          body += chunk.toString();
        });

        response.on("end", () => {
          if ((response.statusCode ?? 500) >= 400) {
            reject(new Error(body || `Docker API returned ${response.statusCode ?? "unknown"}.`));
            return;
          }

          try {
            resolve(JSON.parse(body) as T);
          } catch {
            reject(new Error("Docker API returned invalid JSON."));
          }
        });
      }
    );

    request.on("error", reject);
    request.end();
  });
}

export function parseDockerConfig(config: Record<string, unknown>): DockerProviderConfig {
  const socketPath =
    typeof config.socketPath === "string" && config.socketPath.trim()
      ? config.socketPath.trim()
      : "/var/run/docker.sock";

  return { socketPath };
}

export async function pingDocker(config: DockerProviderConfig) {
  const version = await dockerRequest<{ ApiVersion?: string; Version?: string }>(
    config,
    "/version"
  );

  return {
    apiVersion: String(version.ApiVersion ?? ""),
    dockerVersion: String(version.Version ?? ""),
  };
}

export async function listDockerContainers(config: DockerProviderConfig) {
  return dockerRequest<DockerListItem[]>(config, "/containers/json?all=1");
}

export type { DockerListItem };
