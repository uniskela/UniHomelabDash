import Link from "next/link";
import { Box, Settings } from "lucide-react";
import { ContainerList } from "@/components/container-list";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDockerProviderAction } from "@/lib/providers/actions";
import { listProviderResources } from "@/lib/providers/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ContainersPage() {
  const provider = await getDockerProviderAction();
  const enabled = Boolean(provider?.enabled);
  const { resources, error } = enabled
    ? await listProviderResources("docker")
    : { resources: [], error: undefined };

  const connectionStatus = !enabled
    ? "disabled"
    : error
      ? "error"
      : "connected";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Docker"
        title="Containers"
        description="Read-only container status from your local Docker Engine. Start, stop, and restart actions will arrive in a later release."
        actions={
          <>
            <ConnectionPill status={connectionStatus} />
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">
                <Settings />
                Integration settings
              </Link>
            </Button>
          </>
        }
      />

      <ContainerList containers={resources} error={error} enabled={enabled} />
    </div>
  );
}

function ConnectionPill({
  status,
}: {
  status: "connected" | "disabled" | "error";
}) {
  if (status === "connected") {
    return (
      <Badge variant="outline" className="border-rose-400/40 bg-rose-400/10 text-rose-300">
        <Box className="size-3" />
        Connected
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
