import type { HealthStatus } from "@/lib/services/types";
import type { StackStatus } from "@/lib/providers/types";
import { Badge } from "@/components/ui/badge";
import { toneBadgeClasses, type StatusTone } from "@/components/status-tone";
import { cn } from "@/lib/utils";

const healthTones: Record<HealthStatus, StatusTone> = {
  healthy: "success",
  degraded: "warning",
  unknown: "neutral",
};

const containerTones: Record<string, StatusTone> = {
  running: "success",
  paused: "warning",
  restarting: "warning",
  exited: "danger",
  dead: "danger",
};

const stackTones: Record<StackStatus, StatusTone> = {
  active: "success",
  inactive: "warning",
  unavailable: "danger",
  unknown: "neutral",
};

export function StatusBadge({
  tone,
  label,
  className,
}: {
  tone: StatusTone;
  label: string;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(toneBadgeClasses[tone], className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {sentenceCase(label)}
    </Badge>
  );
}

export function HealthBadge({ status }: { status: HealthStatus }) {
  return <StatusBadge tone={healthTones[status] ?? "neutral"} label={status} />;
}

export function ContainerStatusBadge({ status }: { status: string }) {
  return <StatusBadge tone={containerTones[status] ?? "neutral"} label={status} />;
}

export function StackStatusBadge({ status }: { status: StackStatus }) {
  return <StatusBadge tone={stackTones[status] ?? "neutral"} label={status} />;
}

function sentenceCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
