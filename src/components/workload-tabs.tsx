import Link from "next/link";
import { Box, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";

const workloadItems = [
  { href: "/containers", label: "Containers", icon: Box },
  { href: "/stacks", label: "Stacks", icon: Layers3 },
] as const;

export function WorkloadTabs({ active }: { active: "containers" | "stacks" }) {
  return (
    <nav
      aria-label="Workload type"
      className="inline-flex rounded-lg border border-border/80 bg-muted/30 p-1"
    >
      {workloadItems.map((item) => {
        const Icon = item.icon;
        const selected = active === item.label.toLocaleLowerCase();
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "flex min-h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              selected && "bg-background font-medium text-foreground shadow-sm"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
