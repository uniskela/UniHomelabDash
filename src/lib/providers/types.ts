export type ProviderCapability =
  | "service.status"
  | "service.open"
  | "container.list"
  | "container.status"
  | "container.start"
  | "container.stop"
  | "container.restart";

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
  listResources(context: ProviderContext): Promise<ProviderResource[]>;
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
