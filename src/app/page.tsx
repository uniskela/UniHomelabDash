import Link from "next/link";
import { Activity, HeartPulse, Plus, Server } from "lucide-react";
import { checkAllServiceHealthAction } from "@/lib/services/actions";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { ServiceCard } from "@/components/service-card";
import { StatTile, StatTileGrid } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session-user";
import { listServices } from "@/lib/services/queries";
import { sortServicesByAttention } from "@/lib/services/sort";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const attentionLimit = 3;
const dashboardLimit = 6;

export default async function DashboardPage() {
  await requireAuth();
  const services = await listServices();
  const sortedServices = sortServicesByAttention(services);
  const degradedServices = sortedServices.filter(
    (service) => service.healthStatus === "degraded"
  );
  const attentionServices = degradedServices.slice(0, attentionLimit);
  const attentionIds = new Set(attentionServices.map((service) => service.id));
  const remainingServices = sortedServices.filter((service) => !attentionIds.has(service.id));
  const dashboardServices = remainingServices.slice(0, dashboardLimit);
  const hiddenCount = remainingServices.length - dashboardServices.length;
  const healthyCount = services.filter((service) => service.healthStatus === "healthy").length;
  const unknownCount = services.filter((service) => service.healthStatus === "unknown").length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Service dashboard"
        title="Homelab at a glance"
        description="Open services quickly and check whether key URLs are responding."
        actions={
          services.length > 0 ? (
            <>
              <form action={checkAllServiceHealthAction}>
                <PendingSubmitButton
                  variant="outline"
                  icon={<HeartPulse aria-hidden />}
                  pendingLabel="Checking…"
                >
                  Check all
                </PendingSubmitButton>
              </form>
              <Button asChild>
                <Link href="/services?add=1">
                  <Plus aria-hidden />
                  Add service
                </Link>
              </Button>
            </>
          ) : null
        }
      />

      {services.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No services yet"
          description="Save the homelab apps you open most. Add a health check URL to see whether they respond."
          actionLabel="Add your first service"
          actionHref="/services?add=1"
        />
      ) : (
        <>
          <StatTileGrid label="Service summary">
            <StatTile
              icon={<Server />}
              label="Services"
              value={services.length.toString()}
              detail="Saved links"
            />
            <StatTile
              icon={<HeartPulse />}
              label="Healthy"
              value={healthyCount.toString()}
              detail="Responding"
              tone={healthyCount > 0 ? "success" : "neutral"}
            />
            <StatTile
              icon={<Activity />}
              label="Needs attention"
              value={degradedServices.length.toString()}
              detail={`${unknownCount} unchecked`}
              tone={degradedServices.length > 0 ? "warning" : "neutral"}
            />
          </StatTileGrid>

          {attentionServices.length > 0 ? (
            <section aria-labelledby="attention-heading" className="space-y-4">
              <SectionHeading
                id="attention-heading"
                title="Needs attention"
                count={degradedServices.length}
                action={
                  degradedServices.length > attentionLimit ? (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/services">View all</Link>
                    </Button>
                  ) : null
                }
              />
              <ServiceGrid>
                {attentionServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </ServiceGrid>
            </section>
          ) : null}

          {dashboardServices.length > 0 ? (
            <section aria-labelledby="services-heading" className="space-y-4">
              <SectionHeading
                id="services-heading"
                title={attentionServices.length > 0 ? "Other services" : "Services"}
                action={
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/services">
                      {hiddenCount > 0 ? `View all ${services.length}` : "Manage"}
                    </Link>
                  </Button>
                }
              />
              <ServiceGrid>
                {dashboardServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </ServiceGrid>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function SectionHeading({
  id,
  title,
  count,
  action,
}: {
  id: string;
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-2 text-lg font-medium">
        {title}
        {count != null ? (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {count}
          </span>
        ) : null}
      </h2>
      {action}
    </div>
  );
}

function ServiceGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}
