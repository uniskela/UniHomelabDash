import Link from "next/link";
import { Box, Settings } from "lucide-react";
import { ContainerList } from "@/components/container-list";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDockerProvidersAction } from "@/lib/providers/actions";
import { listProviderResources } from "@/lib/providers/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ContainersPage() {
  const providers = await getDockerProvidersAction();
  const enabled = providers.some((provider) => provider.enabled);
  const actionsEnabled = providers.some((provider) => provider.enabled && !provider.readOnly);
  const { resources, error } = enabled
    ? await listProviderResources("docker")
    : { resources: [], error: undefined };

  const connectionStatus = !enabled ? "disabled" : error ? "error" : "connected";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Docker"
        title="Containers"
        description={
          actionsEnabled
            ? "Container status from your Docker integrations. Destructive actions require confirmation and only appear for integrations with actions enabled."
            : "Read-only container status from your Docker integrations. Enable actions in Settings to start, stop, or restart."
        }
        actions={
          <>
            <ConnectionPill status={connectionStatus} count={providers.filter((provider) => provider.enabled).length} />
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">
                <Settings />
                Integration settings
              </Link>
            </Button>
          </>
        }
      />

      <ContainerList
        containers={resources}
        error={error}
        enabled={enabled}
        actionsEnabled={actionsEnabled}
      />
    </div>
  );
}

function ConnectionPill({
  status,
  count,
}: {
  status: "connected" | "disabled" | "error";
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

  if (status === "error") {
    return (
      <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
        Connection error
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      Disabled
    </Badge>
  );
}
