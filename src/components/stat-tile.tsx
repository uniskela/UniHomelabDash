import { toneIconClasses, toneSurfaceClasses, type StatusTone } from "@/components/status-tone";
import { cn } from "@/lib/utils";

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
  tone?: StatusTone;
}) {
  return (
    <div className={cn("min-w-0 rounded-xl border p-3 sm:p-4", toneSurfaceClasses[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1 sm:space-y-2">
          <p className="text-xs leading-tight text-muted-foreground sm:text-sm">{label}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
          {detail ? (
            <p className="truncate text-xs text-muted-foreground">{detail}</p>
          ) : null}
        </div>
        <span
          aria-hidden
          className={cn(
            "hidden size-10 shrink-0 place-items-center rounded-lg sm:grid [&_svg]:size-4",
            toneIconClasses[tone]
          )}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

export function StatTileGrid({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section aria-label={label} className={cn("grid grid-cols-3 gap-2 sm:gap-3", className)}>
      {children}
    </section>
  );
}
