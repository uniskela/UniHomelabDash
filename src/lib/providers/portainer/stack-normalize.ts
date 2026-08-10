import type { StackResource, StackStatus, StackType } from "@/lib/providers/types";

export type PortainerStackListItem = {
  Id: number;
  Name?: string;
  Type?: number;
  EndpointId: number;
  Status?: number;
  CreationDate?: number;
  UpdateDate?: number;
  [key: string]: unknown;
};

export function normalizePortainerStackStatus(value: number | undefined): StackStatus {
  if (value === 1) {
    return "active";
  }
  if (value === 2) {
    return "inactive";
  }
  return "unknown";
}

export function normalizePortainerStackType(value: number | undefined): StackType {
  if (value === 1) {
    return "Swarm";
  }
  if (value === 2) {
    return "Compose";
  }
  if (value === 3) {
    return "Kubernetes";
  }
  return "Unknown";
}

function unixTimestampToIso(value: number | undefined) {
  if (!Number.isFinite(value) || (value ?? 0) <= 0) {
    return undefined;
  }
  return new Date((value as number) * 1_000).toISOString();
}

export function portainerStackToResource(input: {
  providerId: string;
  providerName: string;
  endpointName: string;
  item: PortainerStackListItem;
}): StackResource {
  return {
    id: `${input.providerId}:${input.item.Id}`,
    name: input.item.Name?.trim() || `Stack ${input.item.Id}`,
    status: normalizePortainerStackStatus(input.item.Status),
    type: normalizePortainerStackType(input.item.Type),
    endpointId: input.item.EndpointId,
    endpointName: input.endpointName,
    providerId: input.providerId,
    providerName: input.providerName,
    createdAt: unixTimestampToIso(input.item.CreationDate),
    updatedAt: unixTimestampToIso(input.item.UpdateDate),
  };
}
