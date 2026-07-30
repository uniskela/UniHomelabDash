"use client";

import { Box, Eye, EyeOff } from "lucide-react";
import { ContainerStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { containerHostLabel, containerProviderCaption } from "@/lib/providers/container-filters";
import type { ContainerViewMode } from "@/lib/providers/container-preferences";
import type { ProviderResource } from "@/lib/providers/types";
import { cn } from "@/lib/utils";

export function ContainerCard({
  container,
  view,
  hidden,
  onOpen,
  onToggleHidden,
}: {
  container: ProviderResource;
  view: ContainerViewMode;
  hidden: boolean;
  onOpen: () => void;
  onToggleHidden: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "w-full rounded-xl border border-border/80 bg-card/80 text-left transition hover:border-primary/20 hover:bg-card",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          view === "tiles" ? "p-3 pr-10" : "p-4 pr-10",
          hidden && "border-dashed opacity-60"
        )}
      >
        {view === "tiles" ? (
          <TileContent container={container} />
        ) : (
          <DetailContent container={container} />
        )}
      </button>

      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        onClick={onToggleHidden}
        title={hidden ? "Show this container" : "Hide this container"}
        aria-label={hidden ? `Show ${container.name}` : `Hide ${container.name}`}
      >
        {hidden ? <Eye /> : <EyeOff />}
      </Button>
    </div>
  );
}

function TileContent({ container }: { container: ProviderResource }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Box className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium">{container.name}</span>
      </div>
      <p className="truncate text-xs text-muted-foreground">{containerHostLabel(container)}</p>
      <ContainerStatusBadge status={container.status} />
    </div>
  );
}

function DetailContent({ container }: { container: ProviderResource }) {
  return (
    <>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted ring-1 ring-border/60">
          <Box className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <span className="truncate font-medium">{container.name}</span>
            <ContainerStatusBadge status={container.status} />
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {containerProviderCaption(container)} · {container.image}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Host: {containerHostLabel(container)}
          </p>
          {container.ports?.length ? (
            <div className="flex flex-wrap gap-1 pt-1">
              {container.ports.slice(0, 3).map((port, index) => (
                <span
                  key={`${port}-${index}`}
                  className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground"
                >
                  {port}
                </span>
              ))}
              {container.ports.length > 3 ? (
                <span className="text-xs text-muted-foreground">
                  +{container.ports.length - 3} more
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {container.summary ? (
        <p className="mt-2 pl-[3.25rem] text-xs text-muted-foreground">{container.summary}</p>
      ) : null}
    </>
  );
}
