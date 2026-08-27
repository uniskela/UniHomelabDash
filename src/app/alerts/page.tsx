import Link from "next/link";
import { Bell } from "lucide-react";
import { getActivityFeed, getAlertsSummary } from "@/lib/activity/queries";
import { ActivityFeed } from "@/components/activity-feed";
import { AlertList } from "@/components/alert-list";
import { PageHeader } from "@/components/page-header";
import { StatTile, StatTileGrid } from "@/components/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session-user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AlertsPage() {
  await requireAuth();

  const [summary, activity] = await Promise.all([
    getAlertsSummary(),
    getActivityFeed(50),
  ]);

  const warningCount = summary.openAlerts.filter((alert) => alert.severity === "warning").length;
  const errorCount = summary.openAlerts.filter((alert) => alert.severity === "error").length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Alerts and activity"
        description="In-app visibility for degraded services, provider failures, and recent container actions. External notifications remain planned."
        actions={
          <Button asChild variant="outline">
            <Link href="/">Back to dashboard</Link>
          </Button>
        }
      />

      <StatTileGrid>
        <StatTile
          icon={<Bell />}
          label="Open alerts"
          value={summary.openCount.toString()}
          detail={`${errorCount} error · ${warningCount} warning`}
          tone={summary.openCount > 0 ? "warning" : "neutral"}
        />
        <StatTile
          icon={<Bell />}
          label="Recent activity"
          value={activity.length.toString()}
          detail="Last 50 events"
          tone="neutral"
        />
        <StatTile
          icon={<Bell />}
          label="Notifications"
          value="Off"
          detail="Push and webhooks planned"
          tone="neutral"
        />
      </StatTileGrid>

      {summary.openCount > 0 ? (
        <Badge variant="outline" className="w-fit">
          {summary.openCount} item{summary.openCount === 1 ? "" : "s"} need attention
        </Badge>
      ) : null}

      <AlertList
        title="Active alerts"
        description="Open and acknowledged items from health checks and provider connection tests."
        alerts={summary.openAlerts}
        emptyTitle="No active alerts"
        emptyDescription="Degraded services and failed provider connection tests appear here."
      />

      <ActivityFeed events={activity} />
    </div>
  );
}
