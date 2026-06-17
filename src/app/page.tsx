import Link from "next/link";
import { Activity, Box, HeartPulse, Plus, Server } from "lucide-react";
import { checkAllServiceHealthAction } from "@/lib/services/actions";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ServiceCard } from "@/components/service-card";
import { StatTile, StatTileGrid } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import { listServices } from "@/lib/services/queries";
import { isDockerProviderEnabled } from "@/lib/providers/store";
import { sortServicesByAttention } from "@/lib/services/sort";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DashboardPage() {
  const services = await listServices();
  const sortedServices = sortServicesByAttention(services);
  const dashboardServices = sortedServices.slice(0, 6);
  const needsAttention = sortedServices.filter(
    (service) => service.healthStatus === "degraded"
  );
  const healthyCount = services.filter((service) => service.healthStatus === "healthy").length;
  const degradedCount = services.filter((service) => service.healthStatus === "degraded").length;
  const unknownCount = services.filter((service) => service.healthStatus === "unknown").length;
  const dockerEnabled = isDockerProviderEnabled();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Service dashboard"
        title="Homelab at a glance"
        description="Open services quickly, keep notes nearby, and check whether key URLs are responding."
        actions={
          <>
            <form action={checkAllServiceHealthAction}>
              <Button type="submit" variant="outline">
                <HeartPulse />
                Check all
              </Button>
            </form>
            <Button asChild>
              <Link href="/services?add=1">
                <Plus />
                Add service
              </Link>
            </Button>
          </>
        }
      />

      <StatTileGrid>
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
          detail="Responding checks"
          tone="healthy"
        />
        <StatTile
          icon={<Activity />}
          label="Needs attention"
          value={degradedCount.toString()}
          detail={`${unknownCount} unknown`}
          tone={degradedCount > 0 ? "warning" : "neutral"}
        />
      </StatTileGrid>

      {dockerEnabled ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/containers">
              <Box />
              View containers
            </Link>
          </Button>
        </div>
      ) : null}

      {needsAttention.length > 0 ? (
        <section className="space-y-4 border-l-2 border-amber-500/40 pl-4">
          <h2 className="text-lg font-medium">Needs attention</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {needsAttention.slice(0, 3).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Services</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/services">Manage</Link>
          </Button>
        </div>

        {dashboardServices.length === 0 ? (
          <EmptyState
            icon={Server}
            title="No services yet"
            description="Add your first service to start shaping your dashboard."
            actionLabel="Create first service"
            actionHref="/services?add=1"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboardServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
