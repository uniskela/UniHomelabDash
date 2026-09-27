import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Collapsible block for secondary detail (setup steps, technical fields).
 * Built on native <details> so it works without JavaScript and keeps
 * keyboard and screen-reader behaviour for free.
 */
export function Disclosure({
  summary,
  description,
  children,
  defaultOpen = false,
  className,
}: {
  summary: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details
      open={defaultOpen}
      className={cn("group rounded-lg border border-border/70 bg-muted/10", className)}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-medium text-foreground">{summary}</span>
          {description ? (
            <span className="block text-xs text-muted-foreground">{description}</span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-border/60 px-3 py-3">{children}</div>
    </details>
  );
}
