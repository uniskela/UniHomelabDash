import Link from "next/link";
import { Settings } from "lucide-react";
import { AsyncStackList } from "@/components/async-stack-list";
import { IntegrationCountBadge } from "@/components/integration-count-badge";
import { PageHeader } from "@/components/page-header";
import { WorkloadTabs } from "@/components/workload-tabs";
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workloads"
        title="Stacks"
        description="Read-only Portainer stack status across supported Docker endpoints. Stack actions are not available yet."
        actions={
          <>
            <IntegrationCountBadge count={enabledProviders.length} />
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings#integrations">
                <Settings aria-hidden />
                Integrations
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
