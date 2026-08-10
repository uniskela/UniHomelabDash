import Link from "next/link";
import { Layers3, Settings } from "lucide-react";
import { AsyncStackList } from "@/components/async-stack-list";
import { PageHeader } from "@/components/page-header";
import { WorkloadTabs } from "@/components/workload-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session-user";
import { getPortainerProvidersAction } from "@/lib/providers/actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function StacksPage() {
  await requireAuth();
  const providers = await getPortainerProvidersAction();
  const enabledProviders = providers.filter((provider) => provider.enabled);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Portainer"
        title="Stacks"
        description="Read-only Portainer stack lifecycle status across supported Docker endpoints. Stack actions and inferred container health are not included."
        actions={
          <>
            <Badge
              variant="outline"
              className={
                enabledProviders.length > 0
                  ? "border-rose-400/40 bg-rose-400/10 text-rose-300"
                  : "text-muted-foreground"
              }
            >
              <Layers3 className="size-3" />
              {enabledProviders.length === 0
                ? "Disabled"
                : enabledProviders.length === 1
                  ? "1 integration"
                  : `${enabledProviders.length} integrations`}
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">
                <Settings />
                Integration settings
              </Link>
            </Button>
          </>
        }
      />

      <WorkloadTabs active="stacks" />
      <AsyncStackList enabled={enabledProviders.length > 0} />
    </div>
  );
}
