import Link from "next/link";
import { Bell, HeartPulse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <Badge variant="secondary" className="w-fit">
          Coming soon
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Alerts</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Push notifications and provider-driven alerts are planned for a future release.
          Use health checks on the dashboard today.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            No alerts yet
          </CardTitle>
          <CardDescription>
            Manual services do not send notifications in this version.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            <HeartPulse className="mt-0.5 size-4 shrink-0 text-foreground" />
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
