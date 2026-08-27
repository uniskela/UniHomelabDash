import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { updateAlertStatusAction } from "@/lib/activity/actions";
import type { AlertView } from "@/lib/activity/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function severityVariant(severity: AlertView["severity"]) {
  if (severity === "error") {
    return "destructive" as const;
  }
  if (severity === "warning") {
    return "outline" as const;
  }
  return "secondary" as const;
}

function SeverityIcon({ severity }: { severity: AlertView["severity"] }) {
  if (severity === "error") {
    return <AlertTriangle className="size-4 text-destructive" />;
  }
  if (severity === "warning") {
    return <AlertTriangle className="size-4 text-amber-400" />;
  }
  return <Info className="size-4 text-muted-foreground" />;
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AlertRow({ alert }: { alert: AlertView }) {
  const isOpen = alert.status === "open" || alert.status === "acknowledged";

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        alert.severity === "error"
          ? "border-destructive/30 bg-destructive/5"
          : alert.severity === "warning"
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-border/60 bg-card/60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <SeverityIcon severity={alert.severity} />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{alert.title}</p>
              <Badge variant={severityVariant(alert.severity)}>{alert.severity}</Badge>
              {alert.status === "acknowledged" ? (
                <Badge variant="outline">Acknowledged</Badge>
              ) : null}
            </div>
            {alert.detail ? (
              <p className="text-sm text-muted-foreground">{alert.detail}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">Updated {formatWhen(alert.updatedAt)}</p>
          </div>
        </div>
      </div>

      {isOpen ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {alert.status === "open" ? (
            <form action={updateAlertStatusAction}>
              <input type="hidden" name="alertId" value={alert.id} />
              <input type="hidden" name="status" value="acknowledged" />
              <Button type="submit" size="sm" variant="outline">
                Acknowledge
              </Button>
            </form>
          ) : null}
          <form action={updateAlertStatusAction}>
            <input type="hidden" name="alertId" value={alert.id} />
            <input type="hidden" name="status" value="resolved" />
            <Button type="submit" size="sm" variant="secondary">
              <CheckCircle2 />
              Resolve
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function AlertList({
  title,
  description,
  alerts,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  alerts: AlertView[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="font-medium">{emptyTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
          </div>
        ) : (
          alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />)
        )}
      </CardContent>
    </Card>
  );
}
