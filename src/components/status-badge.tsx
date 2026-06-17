import type { HealthStatus } from "@/lib/services/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ContainerState =
  | "running"
  | "paused"
  | "restarting"
  | "exited"
  | "dead"
  | "created"
  | "unknown";

function statusClasses(kind: "health" | "container", value: string) {
  if (kind === "health") {
    switch (value as HealthStatus) {
      case "healthy":
        return "border-rose-400/40 bg-rose-400/10 text-rose-300";
      case "degraded":
        return "border-amber-500/40 bg-amber-500/10 text-amber-300";
      default:
        return "border-border bg-muted/40 text-muted-foreground";
    }
  }

  switch (value as ContainerState) {
    case "running":
      return "border-rose-400/40 bg-rose-400/10 text-rose-300";
    case "exited":
    case "dead":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    case "paused":
    case "restarting":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

export function StatusBadge({
  kind,
  value,
  className,
}: {
  kind: "health" | "container";
  value: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", statusClasses(kind, value), className)}
    >
      {value}
    </Badge>
  );
}

export function HealthBadge({ status }: { status: HealthStatus }) {
  return <StatusBadge kind="health" value={status} />;
}

export function ContainerStatusBadge({ status }: { status: string }) {
  return <StatusBadge kind="container" value={status} />;
}
