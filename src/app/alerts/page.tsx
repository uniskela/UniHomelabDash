import Link from "next/link";
import { Bell, HeartPulse } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session-user";

export default async function AlertsPage() {
  await requireAuth();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Push notifications and provider-driven alerts are planned for a future release. Use health checks on the dashboard today."
        actions={<Badge variant="secondary">Coming soon</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell aria-hidden className="size-5" />
            No alerts yet
          </CardTitle>
          <CardDescription>
            Manual services do not send notifications in this version.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            <HeartPulse aria-hidden className="mt-0.5 size-4 shrink-0 text-foreground" />
            <p>
              Run on-demand health checks from the dashboard or Services page to see which
              URLs are responding right now.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
