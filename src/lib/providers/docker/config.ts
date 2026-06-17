export type DockerConnectionMode = "local" | "tcp" | "tls";

export type DockerProviderConfig = {
  mode: DockerConnectionMode;
  socketPath: string;
  host: string;
  port: number;
};

export type DockerTlsCredentials = {
  ca?: string;
  cert?: string;
  key?: string;
};

export type DockerContainerAction = "start" | "stop" | "restart";

export const DOCKER_ACTIONS: DockerContainerAction[] = ["start", "stop", "restart"];

export function parseDockerConfig(config: Record<string, unknown>): DockerProviderConfig {
  const modeRaw = typeof config.mode === "string" ? config.mode : "local";
  const mode: DockerConnectionMode =
    modeRaw === "tcp" || modeRaw === "tls" ? modeRaw : "local";

  const socketPath =
    typeof config.socketPath === "string" && config.socketPath.trim()
      ? config.socketPath.trim()
      : "/var/run/docker.sock";

  const host =
    typeof config.host === "string" && config.host.trim() ? config.host.trim() : "127.0.0.1";

  const portRaw = config.port;
  const port =
    typeof portRaw === "number" && Number.isFinite(portRaw)
      ? portRaw
      : typeof portRaw === "string" && portRaw.trim()
        ? Number.parseInt(portRaw, 10)
        : mode === "tls"
          ? 2376
          : 2375;

  return {
    mode,
    socketPath,
    host,
    port: Number.isFinite(port) ? port : mode === "tls" ? 2376 : 2375,
  };
}

export function parseDockerCredentials(
  credentials: Record<string, string>
): DockerTlsCredentials {
  return {
    ca: credentials.tlsCa?.trim() || undefined,
    cert: credentials.tlsCert?.trim() || undefined,
    key: credentials.tlsKey?.trim() || undefined,
  };
}

export function validateDockerConfig(
  config: DockerProviderConfig,
  credentials: DockerTlsCredentials
): string | null {
  if (config.mode === "local") {
    if (!config.socketPath) {
      return "Socket path is required for local Docker connections.";
    }
    return null;
  }

  if (!config.host) {
    return "Host is required for remote Docker connections.";
  }

  if (!Number.isFinite(config.port) || config.port <= 0 || config.port > 65535) {
    return "Port must be between 1 and 65535.";
  }

  if (config.mode === "tls") {
    if (!credentials.ca || !credentials.cert || !credentials.key) {
      return "TLS mode requires CA, client certificate, and client key.";
    }
  }

  return null;
}
