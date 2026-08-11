import { parseStackResourceId } from "@/lib/providers/portainer/stack-normalize";
import type {
  ListStackContainersResult,
  ProviderContext,
  ProviderHandler,
  ProviderRow,
  ProviderType,
} from "@/lib/providers/types";

export type StackContainerDispatchDependencies = {
  getProviderRow: (providerId: string) => ProviderRow | undefined;
  getHandler: (providerType: ProviderType) => ProviderHandler | null;
  buildContext: (row: ProviderRow) => ProviderContext;
};

const notFound = (): ListStackContainersResult => ({ kind: "not_found", resources: [] });

export async function dispatchStackContainerListing(
  resourceId: string,
  options: { bypassCache?: boolean },
  dependencies: StackContainerDispatchDependencies
): Promise<ListStackContainersResult> {
  const parsed = parseStackResourceId(resourceId);
  if (!parsed || !/^[1-9]\d*$/.test(parsed.stackId)) {
    return notFound();
  }

  const row = dependencies.getProviderRow(parsed.providerId);
  if (!row || !row.enabled || row.type !== "portainer") {
    return notFound();
  }

  const handler = dependencies.getHandler(row.type);
  if (
    !handler ||
    !handler.meta.capabilities.includes("stack.containers") ||
    !handler.listStackContainers
  ) {
    return notFound();
  }

  return handler.listStackContainers(dependencies.buildContext(row), parsed.stackId, options);
}
