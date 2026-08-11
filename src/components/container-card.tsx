"use client";

import { Box, Eye, EyeOff } from "lucide-react";
import { ContainerStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { containerHostLabel, containerProviderCaption } from "@/lib/providers/container-filters";
import type {
  ContainerDensity,
  ContainerViewMode,
  ContainerVisibleField,
} from "@/lib/providers/container-preferences";
import type { ProviderResource } from "@/lib/providers/types";
import { cn } from "@/lib/utils";

export function ContainerCard({
  container,
  view,
  hidden,
  onOpen,
  onToggleHidden,
  visibleFields,
  density = "comfortable",
}: {
  container: ProviderResource;
  view: ContainerViewMode;
  hidden: boolean;
  onOpen: () => void;
  onToggleHidden: () => void;
  visibleFields?: ContainerVisibleField[];
  density?: ContainerDensity;
}) {
  const fields = new Set<ContainerVisibleField>(
    visibleFields ?? ["image", "host", "provider", "ports", "statusText"]
  );
  const compact = density === "compact";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "w-full rounded-xl border border-border/80 bg-card/80 text-left transition hover:border-primary/20 hover:bg-card",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          view === "tiles"
            ? compact
              ? "p-2.5 pr-9"
              : "p-3 pr-10"
            : compact
              ? "p-3 pr-9"
              : "p-4 pr-10",
          hidden && "border-dashed opacity-60"
        )}
      >
        {view === "tiles" ? (
          <TileContent container={container} fields={fields} compact={compact} />
        ) : (
          <DetailContent container={container} fields={fields} compact={compact} />
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

function TileContent({
  container,
  fields,
  compact,
}: {
  container: ProviderResource;
  fields: Set<ContainerVisibleField>;
  compact: boolean;
}) {
  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      <div className="flex items-center gap-2">
        <Box className="size-3.5 shrink-0 text-muted-foreground" />
        <span className={cn("truncate font-medium", compact ? "text-xs" : "text-sm")}>
          {container.name}
        </span>
      </div>
      {fields.has("host") ? (
        <p className="truncate text-xs text-muted-foreground">{containerHostLabel(container)}</p>
      ) : null}
      <ContainerStatusBadge status={container.status} />
    </div>
  );
}

function DetailContent({
  container,
  fields,
  compact,
}: {
  container: ProviderResource;
  fields: Set<ContainerVisibleField>;
  compact: boolean;
}) {
  const showProvider = fields.has("provider");
  const showImage = fields.has("image");
  const captionParts = [
    showProvider ? containerProviderCaption(container) : null,
    showImage ? container.image : null,
  ].filter(Boolean);

  return (
    <>
      <div className={cn("flex items-start gap-3", compact && "gap-2.5")}>
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-lg bg-muted ring-1 ring-border/60",
            compact ? "size-8" : "size-10"
          )}
        >
          <Box className={cn("text-muted-foreground", compact ? "size-3.5" : "size-4")} />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <span className={cn("truncate font-medium", compact && "text-sm")}>{container.name}</span>
            <ContainerStatusBadge status={container.status} />
          </div>
          {captionParts.length ? (
            <p className="truncate font-mono text-xs text-muted-foreground">
              {captionParts.join(" · ")}
            </p>
          ) : null}
          {fields.has("host") ? (
            <p className="truncate text-xs text-muted-foreground">
              Host: {containerHostLabel(container)}
            </p>
          ) : null}
          {fields.has("createdAt") && container.createdAt ? (
            <p className="truncate text-xs text-muted-foreground">
              Created: {new Date(container.createdAt).toLocaleString()}
            </p>
          ) : null}
          {fields.has("ports") && container.ports?.length ? (
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
      {fields.has("statusText") && container.summary ? (
        <p
          className={cn(
            "mt-2 text-xs text-muted-foreground",
            compact ? "pl-10" : "pl-[3.25rem]"
          )}
        >
          {container.summary}
        </p>
      ) : null}
    </>
  );
}
