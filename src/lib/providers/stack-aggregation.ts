import { redactSecrets } from "@/lib/providers/credentials";
import type { ListStacksResult, StackResource } from "@/lib/providers/types";

type StackListing = {
  name: string;
  list: () => Promise<ListStacksResult>;
};

export async function aggregateStackListings(listings: StackListing[]) {
  const settled = await Promise.allSettled(listings.map((listing) => listing.list()));
  const resources: StackResource[] = [];
  const issues: string[] = [];
  let fulfilled = 0;

  for (const [index, result] of settled.entries()) {
    const listingName = listings[index]?.name ?? "Portainer";
    if (result.status === "fulfilled") {
      fulfilled += 1;
      resources.push(...result.value.resources);
      if (result.value.warning) {
        issues.push(`${listingName}: ${result.value.warning}`);
      }
      continue;
    }

    const message = redactSecrets(
      result.reason instanceof Error ? result.reason.message : "Failed to load stacks."
    );
    issues.push(`${listingName}: ${message}`);
  }

  return {
    resources,
    error: fulfilled === 0 && issues.length > 0 ? issues.join(" ") : undefined,
    warning: fulfilled > 0 && issues.length > 0 ? issues.join(" ") : undefined,
  };
}
