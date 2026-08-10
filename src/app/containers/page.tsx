import Link from "next/link";
import { Box, Settings } from "lucide-react";
import { AsyncContainerList } from "@/components/async-container-list";
import { PageHeader } from "@/components/page-header";
import { WorkloadTabs } from "@/components/workload-tabs";
import { Badge } from "@/components/ui/badge";
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
  const enabled = providers.some((provider) => provider.enabled);
  const actionsEnabled = dockerProviders.some((provider) => provider.enabled && !provider.readOnly);
  const connectionStatus = !enabled ? "disabled" : "connected";
  const viewPreferences = readContainerViewPreferences();
  const initialSearchQuery = parseInitialContainerQuery(params.q);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Containers"
        title="Containers"
        description={
          actionsEnabled
            ? "Container status from your Docker and Portainer integrations. Destructive actions require confirmation and only appear for Docker integrations with actions enabled."
            : "Read-only container status from your Docker and Portainer integrations. Enable Docker actions in Settings to start, stop, or restart."
        }
        actions={
          <>
            <ConnectionPill
              status={connectionStatus}
              count={providers.filter((provider) => provider.enabled).length}
            />
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">
                <Settings />
                Integration settings
              </Link>
            </Button>
          </>
        }
      />

      <WorkloadTabs active="containers" />
      <AsyncContainerList
        enabled={enabled}
        actionsEnabled={actionsEnabled}
        initialPreferences={viewPreferences}
        initialSearchQuery={initialSearchQuery}
      />
    </div>
  );
}

function ConnectionPill({
  status,
  count,
}: {
  status: "connected" | "disabled";
  count: number;
}) {
  if (status === "connected") {
    return (
      <Badge variant="outline" className="border-rose-400/40 bg-rose-400/10 text-rose-300">
        <Box className="size-3" />
        {count === 1 ? "1 integration" : `${count} integrations`}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      Disabled
    </Badge>
  );
}
