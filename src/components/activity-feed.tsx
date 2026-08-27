import { Activity, Box, HeartPulse, Server } from "lucide-react";
import type { ActivityEventView } from "@/lib/activity/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function eventIcon(type: string) {
  if (type.startsWith("service.")) {
    return HeartPulse;
  }
  if (type.startsWith("container.")) {
    return Box;
  }
  if (type.startsWith("provider.")) {
    return Server;
  }
  return Activity;
}

function severityClass(severity: ActivityEventView["severity"]) {
  if (severity === "error") {
    return "border-destructive/20";
  }
  if (severity === "warning") {
    return "border-amber-500/20";
  }
  return "border-border/50";
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

function formatTypeLabel(type: string) {
  return type.replaceAll(".", " · ");
}

export function ActivityFeed({
  events,
}: {
  events: ActivityEventView[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>
          Health transitions, provider connection tests, and container actions recorded in-app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="font-medium">No activity yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run health checks or perform container actions to populate the feed.
            </p>
          </div>
        ) : (
          events.map((event) => {
            const Icon = eventIcon(event.type);
            return (
              <div
                key={event.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border bg-card/40 p-4",
                  severityClass(event.severity)
                )}
              >
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-muted [&_svg]:size-4">
                  <Icon />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{event.title}</p>
                    <Badge variant="outline">{event.severity}</Badge>
                  </div>
                  {event.detail ? (
                    <p className="text-sm text-muted-foreground">{event.detail}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatTypeLabel(event.type)} · {formatWhen(event.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
