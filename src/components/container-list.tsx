"use client";

import { useMemo, useState } from "react";
import { Box, Settings } from "lucide-react";
import { ContainerStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { StatTile, StatTileGrid } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { ProviderResource } from "@/lib/providers/types";
import { cn } from "@/lib/utils";

type ContainerFilter = "all" | "running" | "stopped";

const filterOptions: Array<{ id: ContainerFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "running", label: "Running" },
  { id: "stopped", label: "Stopped" },
];

function isRunning(status: string) {
  return status === "running" || status === "restarting";
}

function isStopped(status: string) {
  return status === "exited" || status === "dead" || status === "created" || status === "paused";
}

export function ContainerList({
  containers,
  error,
  enabled,
}: {
  containers: ProviderResource[];
  error?: string | null;
  enabled: boolean;
}) {
  const [selected, setSelected] = useState<ProviderResource | null>(null);
  const [filter, setFilter] = useState<ContainerFilter>("all");

  const filteredContainers = useMemo(() => {
    if (filter === "running") {
      return containers.filter((item) => isRunning(item.status));
    }
    if (filter === "stopped") {
      return containers.filter((item) => isStopped(item.status));
    }
    return containers;
  }, [containers, filter]);

  if (!enabled) {
    return (
      <EmptyState
        icon={Box}
        title="Docker not configured"
        description="Enable the Docker integration in Settings and mount the Docker socket using the compose override example."
        actionLabel="Open integration settings"
        actionHref="/settings"
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={Settings}
        title="Cannot reach Docker"
        description={`${error} Confirm the socket is mounted read-only and that UniHomelabDash runs on the same host as Docker Engine.`}
        actionLabel="Review settings"
        actionHref="/settings"
      />
    );
  }

  if (containers.length === 0) {
    return (
      <EmptyState
        icon={Box}
        title="No containers found"
        description="Docker responded successfully but returned an empty container list."
      />
    );
  }

  const runningCount = containers.filter((item) => isRunning(item.status)).length;
  const stoppedCount = containers.length - runningCount;

  return (
    <>
      <StatTileGrid>
        <StatTile icon={<Box />} label="Total" value={containers.length.toString()} />
        <StatTile
          icon={<Box />}
          label="Running"
          value={runningCount.toString()}
          tone="healthy"
        />
        <StatTile
          icon={<Box />}
          label="Stopped"
          value={stoppedCount.toString()}
          tone={stoppedCount > 0 ? "warning" : "neutral"}
        />
      </StatTileGrid>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.id}
            type="button"
            size="sm"
            variant={filter === option.id ? "secondary" : "outline"}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-3">
        {filteredContainers.map((container) => (
          <button
            key={container.id}
            type="button"
            onClick={() => setSelected(container)}
            className={cn(
              "rounded-xl border border-border/80 bg-card/80 p-4 text-left transition hover:border-primary/20 hover:bg-card",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            )}
          >
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
                  {container.image}
                </p>
                {container.ports?.length ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {container.ports.slice(0, 3).map((port) => (
                      <span
                        key={port}
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
          </button>
        ))}
      </div>

      {filteredContainers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No containers match this filter.</p>
      ) : null}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          {selected ? (
            <>
              <DialogHeader className="border-b border-border/80 p-4 pr-12">
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription className="font-mono text-xs">
                  {selected.image}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto p-4 text-sm">
                <DetailRow label="State" value={selected.status} />
                {selected.summary ? <DetailRow label="Status" value={selected.summary} /> : null}
                {selected.createdAt ? (
                  <DetailRow
                    label="Created"
                    value={new Date(selected.createdAt).toLocaleString()}
                  />
                ) : null}
                {selected.ports?.length ? (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                        Ports
                      </div>
                      <ul className="space-y-1">
                        {selected.ports.map((port) => (
                          <li key={port} className="font-mono text-xs">
                            {port}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : null}
                {selected.labels && Object.keys(selected.labels).length > 0 ? (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                        Labels
                      </div>
                      <ul className="space-y-1">
                        {Object.entries(selected.labels).map(([key, value]) => (
                          <li key={key} className="font-mono text-xs break-all">
                            {key}={value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}
