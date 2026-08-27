import type { ActivitySeverity } from "@/lib/db/schema";

export type ActivityResourceType = "service" | "provider" | "container";

export type ActivityEventType =
  | "service.health.degraded"
  | "service.health.recovered"
  | "provider.connection.failed"
  | "provider.connection.recovered"
  | "container.action.success"
  | "container.action.failed";

export type RecordActivityInput = {
  type: ActivityEventType;
  severity: ActivitySeverity;
  title: string;
  detail?: string;
  resourceType?: ActivityResourceType;
  resourceId?: string;
  providerId?: string;
  metadata?: Record<string, string>;
  /** When set, opens or updates an open alert with this dedupe key. */
  alertDedupeKey?: string;
  /** When true, resolves any open alert matching alertDedupeKey. */
  resolveAlert?: boolean;
};

export type ActivityEventView = {
  id: string;
  type: string;
  severity: ActivitySeverity;
  title: string;
  detail: string;
  resourceType: string | null;
  resourceId: string | null;
  providerId: string | null;
  metadata: Record<string, string>;
  createdAt: string;
};

export type AlertView = {
  id: string;
  activityEventId: string | null;
  type: string;
  severity: ActivitySeverity;
  title: string;
  detail: string;
  resourceType: string | null;
  resourceId: string | null;
  providerId: string | null;
  status: "open" | "acknowledged" | "resolved";
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type HealthStatus = "healthy" | "degraded" | "unknown";

export function serviceHealthDedupeKey(serviceId: string) {
  return `service:${serviceId}:health`;
}

export function providerConnectionDedupeKey(providerId: string) {
  return `provider:${providerId}:connection`;
}

export function shouldRecordHealthTransition(
  previousStatus: HealthStatus,
  nextStatus: HealthStatus
) {
  if (previousStatus === nextStatus) {
    return false;
  }

  if (nextStatus === "degraded" && previousStatus !== "degraded") {
    return true;
  }

  if (nextStatus === "healthy" && (previousStatus === "degraded" || previousStatus === "unknown")) {
    return previousStatus === "degraded";
  }

  return false;
}

export function buildHealthTransitionActivity(input: {
  serviceId: string;
  serviceName: string;
  previousStatus: HealthStatus;
  nextStatus: HealthStatus;
  errorMessage?: string;
}): RecordActivityInput | null {
  if (!shouldRecordHealthTransition(input.previousStatus, input.nextStatus)) {
    return null;
  }

  const dedupeKey = serviceHealthDedupeKey(input.serviceId);

  if (input.nextStatus === "degraded") {
    return {
      type: "service.health.degraded",
      severity: "warning",
      title: `${input.serviceName} is degraded`,
      detail: input.errorMessage ?? "Health check did not succeed.",
      resourceType: "service",
      resourceId: input.serviceId,
      alertDedupeKey: dedupeKey,
    };
  }

  return {
    type: "service.health.recovered",
    severity: "info",
    title: `${input.serviceName} recovered`,
    detail: "Health check is responding again.",
    resourceType: "service",
    resourceId: input.serviceId,
    alertDedupeKey: dedupeKey,
    resolveAlert: true,
  };
}

export function buildProviderConnectionActivity(input: {
  providerId: string;
  providerName: string;
  providerType: string;
  ok: boolean;
  message: string;
  hadPreviousError: boolean;
}): RecordActivityInput | null {
  const dedupeKey = providerConnectionDedupeKey(input.providerId);

  if (!input.ok) {
    return {
      type: "provider.connection.failed",
      severity: "error",
      title: `${input.providerName} connection failed`,
      detail: input.message,
      resourceType: "provider",
      resourceId: input.providerId,
      providerId: input.providerId,
      metadata: { providerType: input.providerType },
      alertDedupeKey: dedupeKey,
    };
  }

  if (input.hadPreviousError) {
    return {
      type: "provider.connection.recovered",
      severity: "info",
      title: `${input.providerName} connection restored`,
      detail: input.message || "Connection test succeeded.",
      resourceType: "provider",
      resourceId: input.providerId,
      providerId: input.providerId,
      metadata: { providerType: input.providerType },
      alertDedupeKey: dedupeKey,
      resolveAlert: true,
    };
  }

  return null;
}

export function buildContainerActionActivity(input: {
  containerId: string;
  containerName: string;
  providerId: string;
  providerName: string;
  action: string;
  ok: boolean;
  message: string;
}): RecordActivityInput {
  return {
    type: input.ok ? "container.action.success" : "container.action.failed",
    severity: input.ok ? "info" : "warning",
    title: input.ok
      ? `Container ${input.action} succeeded`
      : `Container ${input.action} failed`,
    detail: `${input.containerName}: ${input.message}`,
    resourceType: "container",
    resourceId: input.containerId,
    providerId: input.providerId,
    metadata: {
      action: input.action,
      providerName: input.providerName,
      containerName: input.containerName,
    },
  };
}
