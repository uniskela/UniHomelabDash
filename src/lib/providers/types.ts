export type ProviderCapability =
  | "service.status"
  | "service.open"
  | "container.list"
  | "container.status"
  | "container.logs"
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
