import type { HealthStatus, ManualService } from "@/lib/services/types";

const healthPriority: Record<HealthStatus, number> = {
  degraded: 0,
  unknown: 1,
  healthy: 2,
};

export function sortServicesByAttention(services: ManualService[]) {
  return [...services].sort((left, right) => {
    const priorityDiff =
      healthPriority[left.healthStatus] - healthPriority[right.healthStatus];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}
