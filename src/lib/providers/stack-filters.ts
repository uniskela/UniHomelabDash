import type { StackResource, StackStatus } from "@/lib/providers/types";

export type StackStatusFilter = "all" | StackStatus;

export function stackEndpointKey(stack: StackResource) {
  return `${stack.providerId}:${stack.endpointId}`;
}

export function getStackSummary(stacks: StackResource[]) {
  return stacks.reduce(
    (summary, stack) => {
      summary.total += 1;
      summary[stack.status] += 1;
      return summary;
    },
    { total: 0, active: 0, inactive: 0, unknown: 0 }
  );
}

export function listStackEndpointOptions(stacks: StackResource[]) {
  const options = new Map<string, { value: string; label: string }>();

  for (const stack of stacks) {
    const value = stackEndpointKey(stack);
    options.set(value, {
      value,
      label: `${stack.endpointName} · ${stack.providerName}`,
    });
  }

  return Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function filterStacks(
  stacks: StackResource[],
  options: {
    status?: StackStatusFilter;
    endpoint?: string;
    search?: string;
  } = {}
) {
  const status = options.status ?? "all";
  const endpoint = options.endpoint?.trim() ?? "";
  const search = options.search?.trim().toLocaleLowerCase() ?? "";

  return stacks.filter((stack) => {
    if (status !== "all" && stack.status !== status) {
      return false;
    }
    if (endpoint && stackEndpointKey(stack) !== endpoint) {
      return false;
    }
    if (!search) {
      return true;
    }

    return [
      stack.id,
      stack.name,
      stack.status,
      stack.type,
      stack.endpointName,
      stack.providerName,
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(search);
  });
}
