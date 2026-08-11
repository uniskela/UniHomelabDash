import { sanitizeLabelsToEntries } from "@/lib/providers/container-labels";
import {
  formatContainerPorts,
  normalizeContainerName,
  normalizeContainerState,
} from "@/lib/providers/docker/normalize";
import type {
  ContainerDetailResource,
  ContainerHealthStatus,
  ContainerResourceLimits,
  ContainerRestartPolicy,
  ContainerSafeMount,
  ProviderType,
} from "@/lib/providers/types";

export type DockerInspectPayload = {
  Id?: string;
  Name?: string;
  Created?: string;
  Path?: string;
  Args?: string[];
  State?: {
    Status?: string;
    Running?: boolean;
    Paused?: boolean;
    Restarting?: boolean;
    Dead?: boolean;
    Pid?: number;
    ExitCode?: number;
    Error?: string;
    StartedAt?: string;
    FinishedAt?: string;
    Health?: {
      Status?: string;
      Log?: unknown;
      FailingStreak?: number;
    };
  };
  Image?: string;
  ResolvConfPath?: string;
  HostnamePath?: string;
  HostsPath?: string;
  LogPath?: string;
  RestartCount?: number;
  Driver?: string;
  Platform?: string;
  MountLabel?: string;
  ProcessLabel?: string;
  AppArmorProfile?: string;
  ExecIDs?: string[] | null;
  HostConfig?: {
    Memory?: number;
    NanoCpus?: number;
    CpuShares?: number;
    PidsLimit?: number | null;
    RestartPolicy?: {
      Name?: string;
      MaximumRetryCount?: number;
    };
    Binds?: string[];
    NetworkMode?: string;
  };
  Config?: {
    Image?: string;
    Labels?: Record<string, string>;
    Env?: string[];
    Cmd?: string[];
    Entrypoint?: string[] | string;
    Healthcheck?: unknown;
  };
  NetworkSettings?: {
    Ports?: Record<string, Array<{ HostIp?: string; HostPort?: string }> | null>;
    Networks?: Record<string, { NetworkID?: string; IPAddress?: string } | null>;
  };
  Mounts?: Array<{
    Type?: string;
    Name?: string;
    Source?: string;
    Destination?: string;
    Driver?: string;
    Mode?: string;
    RW?: boolean;
    Propagation?: string;
  }>;
};

export function normalizeDockerInspect(input: {
  payload: unknown;
  providerId: string;
  providerType: ProviderType;
  resourceId: string;
  meta?: Record<string, string>;
}): ContainerDetailResource | null {
  if (!input.payload || typeof input.payload !== "object") {
    return null;
  }

  const payload = input.payload as DockerInspectPayload;
  const id = typeof payload.Id === "string" && payload.Id.trim() ? payload.Id : input.resourceId;
  if (!id.trim()) {
    return null;
  }

  const name = normalizeInspectName(payload.Name);
  const state = normalizeContainerState(payload.State?.Status);
  const status = payload.State?.Status ?? state;
  const image =
    (typeof payload.Config?.Image === "string" && payload.Config.Image) ||
    (typeof payload.Image === "string" && payload.Image) ||
    "unknown";

  return {
    id: input.providerType === "portainer" ? input.resourceId : id,
    name,
    state,
    status,
    health: normalizeHealthStatus(payload.State?.Health?.Status, Boolean(payload.State?.Health)),
    image,
    imageId: typeof payload.Image === "string" ? payload.Image : null,
    platform: typeof payload.Platform === "string" && payload.Platform.trim() ? payload.Platform : null,
    createdAt: normalizeTimestamp(payload.Created),
    startedAt: normalizeTimestamp(payload.State?.StartedAt),
    finishedAt: normalizeTimestamp(payload.State?.FinishedAt),
    restartPolicy: normalizeRestartPolicy(payload.HostConfig?.RestartPolicy),
    ports: formatContainerPorts(payload.NetworkSettings?.Ports),
    networks: normalizeNetworks(payload.NetworkSettings?.Networks),
    mounts: normalizeSafeMounts(payload.Mounts),
    limits: normalizeLimits(payload.HostConfig),
    labels: sanitizeLabelsToEntries(payload.Config?.Labels),
    providerType: input.providerType,
    providerId: input.providerId,
    meta: input.meta,
  };
}

function normalizeInspectName(name: string | undefined) {
  if (typeof name !== "string" || !name.trim()) {
    return "unknown";
  }
  return normalizeContainerName([name]);
}

function normalizeHealthStatus(
  status: string | undefined,
  hasHealth: boolean
): ContainerHealthStatus {
  if (!hasHealth) {
    return "none";
  }
  switch ((status ?? "").toLowerCase()) {
    case "healthy":
      return "healthy";
    case "unhealthy":
      return "unhealthy";
    case "starting":
      return "starting";
    case "none":
      return "none";
    default:
      return "unknown";
  }
}

function normalizeRestartPolicy(
  policy:
    | (DockerInspectPayload["HostConfig"] extends infer H
        ? H extends { RestartPolicy?: infer R }
          ? R
          : never
        : never)
    | undefined
): ContainerRestartPolicy | null {
  if (!policy || typeof policy !== "object") {
    return null;
  }
  const name = typeof policy.Name === "string" ? policy.Name.trim() : "";
  if (!name) {
    return null;
  }
  const maximumRetryCount =
    typeof policy.MaximumRetryCount === "number" && Number.isFinite(policy.MaximumRetryCount)
      ? policy.MaximumRetryCount
      : null;
  return { name, maximumRetryCount };
}

function normalizeNetworks(
  networks:
    | (DockerInspectPayload["NetworkSettings"] extends infer N
        ? N extends { Networks?: infer R }
          ? R
          : never
        : never)
    | undefined
): string[] {
  if (!networks || typeof networks !== "object") {
    return [];
  }
  return Object.keys(networks)
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 50);
}

/**
 * Safe mounts omit host bind Source paths. Volume mounts may expose Name.
 */
export function normalizeSafeMounts(
  mounts: DockerInspectPayload["Mounts"]
): ContainerSafeMount[] {
  if (!Array.isArray(mounts)) {
    return [];
  }

  return mounts
    .map((mount) => {
      if (!mount || typeof mount !== "object") {
        return null;
      }
      const type = typeof mount.Type === "string" ? mount.Type.trim().toLowerCase() : "unknown";
      const destination =
        typeof mount.Destination === "string" && mount.Destination.trim()
          ? mount.Destination.trim()
          : "";
      if (!destination) {
        return null;
      }
      const readOnly = mount.RW === false;
      const name =
        type === "volume" && typeof mount.Name === "string" && mount.Name.trim()
          ? mount.Name.trim().slice(0, 200)
          : null;

      return {
        type: type || "unknown",
        destination: destination.slice(0, 500),
        readOnly,
        name,
      } satisfies ContainerSafeMount;
    })
    .filter((mount): mount is ContainerSafeMount => Boolean(mount))
    .slice(0, 50);
}

function normalizeLimits(
  hostConfig: DockerInspectPayload["HostConfig"]
): ContainerResourceLimits {
  return {
    memoryBytes: finiteOrNull(hostConfig?.Memory),
    nanoCpus: finiteOrNull(hostConfig?.NanoCpus),
    cpuShares: finiteOrNull(hostConfig?.CpuShares),
    pidsLimit: finiteOrNull(hostConfig?.PidsLimit ?? undefined),
  };
}

function finiteOrNull(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

function normalizeTimestamp(value: string | undefined) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  // Docker uses zero-time for unset timestamps.
  if (value.startsWith("0001-01-01")) {
    return null;
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return new Date(parsed).toISOString();
}

/** True when inspect indicates a non-running lifecycle for stats. */
export function isStatsUnavailableState(state: string | undefined) {
  const normalized = normalizeContainerState(state);
  return (
    normalized === "exited" ||
    normalized === "dead" ||
    normalized === "created" ||
    normalized === "paused"
  );
}
