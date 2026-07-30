import Link from "next/link";
import { Box, Settings } from "lucide-react";
import { AsyncContainerList } from "@/components/async-container-list";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session-user";
import { getDockerProvidersAction, getPortainerProvidersAction } from "@/lib/providers/actions";
import { readContainerViewPreferences } from "@/lib/providers/container-preferences-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ContainersPage() {
  await requireAuth();
  const dockerProviders = await getDockerProvidersAction();
  const portainerProviders = await getPortainerProvidersAction();
  const providers = [...dockerProviders, ...portainerProviders];
  const enabled = providers.some((provider) => provider.enabled);
  const actionsEnabled = dockerProviders.some((provider) => provider.enabled && !provider.readOnly);
  const connectionStatus = !enabled ? "disabled" : "connected";
  const viewPreferences = readContainerViewPreferences();

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

      <AsyncContainerList
        enabled={enabled}
        actionsEnabled={actionsEnabled}
        initialPreferences={viewPreferences}
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
