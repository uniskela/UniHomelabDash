export type ProviderCapability =
  | "service.status"
  | "service.open"
  | "container.list"
  | "container.status"
  | "container.logs"
  | "container.inspect"
  | "container.stats"
  | "container.start"
  | "container.stop"
  | "container.restart"
  | "stack.list"
  | "stack.status"
  | "stack.containers";

export type ProviderType = "manual" | "docker" | "portainer";

export type ActionSafety = "safe" | "confirm" | "destructive";

export type ProviderResourceKind = "manual-service" | "container";

export type ProviderResource = {
  id: string;
  kind: ProviderResourceKind;
  name: string;
  status: string;
  summary?: string;
  image?: string;
  ports?: string[];
  createdAt?: string;
  labels?: Record<string, string>;
  providerType: ProviderType;
  providerId?: string;
  meta?: Record<string, string>;
};

export type ConnectionTestResult = {
  ok: boolean;
  message: string;
  details?: Record<string, string>;
};

export type ContainerLogsOptions = {
  tail?: number;
  timestamps?: boolean;
};

export type ContainerLogsResult = {
  ok: boolean;
  logs: string;
  message?: string;
};

export type ListResourcesResult = {
  resources: ProviderResource[];
  warning?: string;
};

export type StackLifecycleStatus = "active" | "inactive" | "unknown";

export type EndpointStatus = "connected" | "disconnected" | "unknown";

export type StackStatus = StackLifecycleStatus | "unavailable";

export type StackType = "Swarm" | "Compose" | "Kubernetes" | "Unknown";

export type StackResource = {
  id: string;
  name: string;
  status: StackStatus;
  reportedStatus: StackLifecycleStatus;
  endpointStatus: EndpointStatus;
  type: StackType;
  endpointId: number;
  endpointName: string;
  providerId: string;
  providerName: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ListStacksResult = {
  resources: StackResource[];
  warning?: string;
};

export type StackContainerResource = {
  id: string;
  name: string;
  state: ContainerState;
  status: string;
  image: string;
  ports: string[];
  createdAt?: string;
  providerId: string;
  providerName: string;
  endpointId: number;
  endpointName: string;
};

export type ListStackContainersResult =
  | { kind: "ok"; resources: StackContainerResource[]; cachedAt?: number }
  | { kind: "unavailable"; reason: "endpoint_disconnected"; resources: [] }
  | { kind: "not_found"; resources: [] };

export type ProviderDefinitionMeta = {
  type: ProviderType;
  name: string;
  description: string;
  capabilities: ProviderCapability[];
  supportsCredentials: boolean;
};

import type { DockerConnectionMode } from "@/lib/providers/docker/config";

export type DockerProviderConfig = {
  mode: DockerConnectionMode;
  socketPath: string;
  host: string;
  port: number;
};

export type ProviderRow = {
  id: string;
  type: ProviderType;
  name: string;
  enabled: boolean;
  readOnly: boolean;
  configJson: string;
  credentialsEncrypted: string | null;
  lastTestedAt: string | null;
  lastError: string;
  createdAt: string;
  updatedAt: string;
};

export type ProviderPublicView = {
  id: string;
  type: ProviderType;
  name: string;
  enabled: boolean;
  readOnly: boolean;
  config: Record<string, unknown>;
  lastTestedAt: string | null;
  lastError: string;
  definition: ProviderDefinitionMeta;
};

export type ProviderContext = {
  provider: ProviderRow;
  config: Record<string, unknown>;
  credentials: Record<string, string>;
};

export type ContainerHealthStatus =
  | "healthy"
  | "unhealthy"
  | "starting"
  | "none"
  | "unknown";

export type ContainerRestartPolicy = {
  name: string;
  maximumRetryCount: number | null;
};

/** Mount metadata safe for the UI — never includes host bind source paths. */
export type ContainerSafeMount = {
  type: string;
  destination: string;
  readOnly: boolean;
  name: string | null;
};

export type ContainerResourceLimits = {
  memoryBytes: number | null;
  nanoCpus: number | null;
  cpuShares: number | null;
  pidsLimit: number | null;
};

/**
 * Operational labels. Non-allowlisted values are hidden (`value: null`,
 * `visible: false`) so secrets in arbitrary labels never reach the browser.
 */
export type ContainerLabelEntry = {
  key: string;
  value: string | null;
  visible: boolean;
};

export type ContainerDetailResource = {
  id: string;
  name: string;
  state: ContainerState;
  status: string;
  health: ContainerHealthStatus;
  image: string;
  imageId: string | null;
  platform: string | null;
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  restartPolicy: ContainerRestartPolicy | null;
  ports: string[];
  networks: string[];
  mounts: ContainerSafeMount[];
  limits: ContainerResourceLimits;
  labels: ContainerLabelEntry[];
  providerType: ProviderType;
  providerId: string;
  meta?: Record<string, string>;
};

/** Short-lived operational snapshot — missing counters stay null, never zero-filled. */
export type ContainerStatsSnapshot = {
  sampledAt: string;
  cpuPercent: number | null;
  memoryUsageBytes: number | null;
  memoryLimitBytes: number | null;
  memoryPercent: number | null;
  networkRxBytes: number | null;
  networkTxBytes: number | null;
  blockReadBytes: number | null;
  blockWriteBytes: number | null;
  pids: number | null;
};

export type ContainerUnavailableReason =
  | "stopped"
  | "endpoint_disconnected"
  | "unsupported"
  | "timeout"
  | "malformed"
  | "provider_disabled"
  | "provider_not_found";

export type ContainerDetailResult =
  | { kind: "ok"; detail: ContainerDetailResource; cachedAt?: number }
  | { kind: "unavailable"; reason: ContainerUnavailableReason; message: string }
  | { kind: "not_found"; message: string }
  | { kind: "error"; reason: ContainerUnavailableReason; message: string };

export type ContainerStatsResult =
  | { kind: "ok"; stats: ContainerStatsSnapshot; cachedAt?: number }
  | { kind: "unavailable"; reason: ContainerUnavailableReason; message: string }
  | { kind: "not_found"; message: string }
  | { kind: "error"; reason: ContainerUnavailableReason; message: string };

export interface ProviderHandler {
  meta: ProviderDefinitionMeta;
  testConnection(context: ProviderContext): Promise<ConnectionTestResult>;
  listResources(context: ProviderContext): Promise<ListResourcesResult>;
  listStacks?(context: ProviderContext): Promise<ListStacksResult>;
  listStackContainers?(
    context: ProviderContext,
    stackId: string,
    options?: { bypassCache?: boolean }
  ): Promise<ListStackContainersResult>;
  getLogs?(
    context: ProviderContext,
    resourceId: string,
    options?: ContainerLogsOptions
  ): Promise<ContainerLogsResult>;
  inspectContainer?(
    context: ProviderContext,
    resourceId: string
  ): Promise<ContainerDetailResult>;
  getContainerStats?(
    context: ProviderContext,
    resourceId: string
  ): Promise<ContainerStatsResult>;
  executeAction?(
    context: ProviderContext,
    action: string,
    resourceId: string
  ): Promise<{ ok: boolean; message: string }>;
}

export type ContainerState =
  | "running"
  | "paused"
  | "restarting"
  | "exited"
  | "dead"
  | "created"
  | "unknown";

export type ContainerResource = {
  id: string;
  name: string;
  image: string;
  state: ContainerState;
  status: string;
  ports: string[];
  createdAt: string;
  labels: Record<string, string>;
};
