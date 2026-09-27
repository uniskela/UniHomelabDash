import Link from "next/link";
import { Settings } from "lucide-react";
import { AsyncContainerList } from "@/components/async-container-list";
import { IntegrationCountBadge } from "@/components/integration-count-badge";
import { PageHeader } from "@/components/page-header";
import { WorkloadTabs } from "@/components/workload-tabs";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session-user";
import { getDockerProvidersAction, getPortainerProvidersAction } from "@/lib/providers/actions";
import { readContainerViewPreferences } from "@/lib/providers/container-preferences-store";
import { parseInitialContainerQuery } from "@/lib/providers/container-query-params";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ContainerSearchParams = {
  q?: string | string[];
};

export default async function ContainersPage({
  searchParams,
}: {
  searchParams: Promise<ContainerSearchParams>;
}) {
  await requireAuth();
  const params = await searchParams;
  const dockerProviders = await getDockerProvidersAction();
  const portainerProviders = await getPortainerProvidersAction();
  const providers = [...dockerProviders, ...portainerProviders];
  const enabledCount = providers.filter((provider) => provider.enabled).length;
  const actionsEnabled = providers.some((provider) => provider.enabled && !provider.readOnly);
  const viewPreferences = readContainerViewPreferences();
  const initialSearchQuery = parseInitialContainerQuery(params.q);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workloads"
        title="Containers"
        description={
          actionsEnabled
            ? "Status from your Docker and Portainer integrations. Start, stop, and restart always ask for confirmation first."
            : "Read-only status from your Docker and Portainer integrations. Turn on container actions per integration in Settings."
        }
        actions={
          <>
            <IntegrationCountBadge count={enabledCount} />
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings#integrations">
                <Settings aria-hidden />
                Integrations
              </Link>
            </Button>
          </>
        }
      />

      <WorkloadTabs active="containers" />
      <AsyncContainerList
        enabled={enabledCount > 0}
        actionsEnabled={actionsEnabled}
        initialPreferences={viewPreferences}
        initialSearchQuery={initialSearchQuery}
      />
    </div>
  );
}
