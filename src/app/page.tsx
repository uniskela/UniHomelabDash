import Link from "next/link";
import { Activity, HeartPulse, Plus, Server } from "lucide-react";
import { checkAllServiceHealthAction } from "@/lib/services/actions";
import { ServiceCard } from "@/components/service-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listServices } from "@/lib/services/queries";
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

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <Badge variant="secondary" className="w-fit">
          Service dashboard
        </Badge>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Homelab at a glance
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Open services quickly, keep notes nearby, and check whether key
              URLs are responding.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<Server />}
          label="Services"
          value={services.length.toString()}
          detail="Saved links"
        />
        <SummaryCard
          icon={<HeartPulse />}
          label="Healthy"
          value={healthyCount.toString()}
          detail="Responding checks"
        />
        <SummaryCard
          icon={<Activity />}
          label="Needs attention"
          value={degradedCount.toString()}
          detail={`${unknownCount} unknown`}
        />
      </section>

      {needsAttention.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Needs attention</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {needsAttention.slice(0, 3).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Services</h2>
          <Button variant="ghost" asChild>
            <Link href="/services">Manage</Link>
          </Button>
        </div>

        {dashboardServices.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No services yet</CardTitle>
              <CardDescription>
                Add your first service to start shaping your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/services?add=1">Create first service</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dashboardServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-foreground [&_svg]:size-4">{icon}</span>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
