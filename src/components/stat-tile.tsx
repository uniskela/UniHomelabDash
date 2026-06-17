import { cn } from "@/lib/utils";

type StatTone = "neutral" | "healthy" | "warning";

const toneClasses: Record<StatTone, string> = {
  neutral: "border-border/60 bg-card/80",
  healthy: "border-rose-400/20 bg-rose-400/5",
  warning: "border-amber-500/30 bg-amber-500/5",
};

const iconToneClasses: Record<StatTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  healthy: "bg-rose-400/10 text-rose-300",
  warning: "bg-amber-500/10 text-amber-300",
};

export function StatTile({
  icon,
  label,
  value,
  detail,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  tone?: StatTone;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        toneClasses[tone]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-lg [&_svg]:size-4",
            iconToneClasses[tone]
          )}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

export function StatTileGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-3">{children}</div>;
}
