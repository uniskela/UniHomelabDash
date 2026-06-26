"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Box, FileText, LayoutDashboard, Play, RotateCcw, Settings, Square } from "lucide-react";
import { ContainerStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { StatTile, StatTileGrid } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { initialProviderActionState } from "@/lib/providers/action-state";
import { executeContainerAction } from "@/lib/providers/actions";
import { buildContainerServiceDefaults } from "@/lib/providers/docker/dashboard-prefill";
import type { ProviderResource } from "@/lib/providers/types";
import { cn } from "@/lib/utils";

type ContainerAction = "start" | "stop" | "restart";

type ContainerFilter = "all" | "running" | "stopped";
type LogLineCount = 10 | 50 | 100 | 200 | 500;
type LogLevelFilter = "all" | "log" | "warn" | "error";

const filterOptions: Array<{ id: ContainerFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "running", label: "Running" },
  { id: "stopped", label: "Stopped" },
];

const logLineOptions: LogLineCount[] = [10, 50, 100, 200, 500];

const logLevelOptions: Array<{ id: LogLevelFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "log", label: "Log" },
  { id: "warn", label: "Warn" },
  { id: "error", label: "Error" },
];

const warningPattern = /\bwarn(?:ing)?\b/i;
const errorPattern = /\b(?:error|err|fatal|panic|exception)\b/i;

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
  actionsEnabled = false,
}: {
  containers: ProviderResource[];
  error?: string | null;
  enabled: boolean;
  actionsEnabled?: boolean;
}) {
  const [selected, setSelected] = useState<ProviderResource | null>(null);
  const [pendingAction, setPendingAction] = useState<ContainerAction | null>(null);
  const [submittedAction, setSubmittedAction] = useState<ContainerAction | null>(null);
  const [filter, setFilter] = useState<ContainerFilter>("all");
  const [logs, setLogs] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logLineCount, setLogLineCount] = useState<LogLineCount>(200);
  const [logLevelFilter, setLogLevelFilter] = useState<LogLevelFilter>("all");
  const [showLabels, setShowLabels] = useState(false);
  const [actionState, actionFormAction, actionPending] = useActionState(
    executeContainerAction,
    initialProviderActionState
  );

  function resetLogs() {
    setLogs(null);
    setLogsError(null);
    setLogsLoading(false);
    setLogLevelFilter("all");
  }

  function openContainer(container: ProviderResource) {
    resetLogs();
    setShowLabels(false);
    setSelected(container);
  }

  function closeContainer() {
    resetLogs();
    setShowLabels(false);
    setSelected(null);
  }

  async function loadLogs(container: ProviderResource) {
    setLogsLoading(true);
    setLogsError(null);

    try {
      const params = new URLSearchParams({ tail: String(logLineCount) });
      if (container.providerId) {
        params.set("providerId", container.providerId);
      }
      const response = await fetch(
        `/api/docker/containers/${encodeURIComponent(container.id)}/logs?${params.toString()}`
      );
      const payload = (await response.json().catch(() => null)) as
        | { logs?: string; error?: string }
        | null;

      if (!response.ok) {
        setLogs(null);
        setLogsError(payload?.error ?? "Failed to load container logs.");
        return;
      }

      setLogs(payload?.logs ?? "");
    } catch (error) {
      setLogs(null);
      setLogsError(error instanceof Error ? error.message : "Failed to load container logs.");
    } finally {
      setLogsLoading(false);
    }
  }

  const filteredContainers = useMemo(() => {
    if (filter === "running") {
      return containers.filter((item) => isRunning(item.status));
    }
    if (filter === "stopped") {
      return containers.filter((item) => isStopped(item.status));
    }
    return containers;
  }, [containers, filter]);

  const visibleLogs = useMemo(() => filterLogs(logs ?? "", logLevelFilter), [logs, logLevelFilter]);

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
            key={`${container.providerId ?? container.providerType}-${container.id}`}
            type="button"
            onClick={() => openContainer(container)}
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
                  {providerName(container)} · {container.image}
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
          </button>
        ))}
      </div>

      {filteredContainers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No containers match this filter.</p>
      ) : null}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && closeContainer()}>
        <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden border-rose-500/20 bg-card p-0 shadow-2xl shadow-rose-950/20 sm:max-w-2xl lg:max-w-4xl">
          {selected ? (
            <>
              <DialogHeader className="border-b border-rose-500/20 bg-gradient-to-br from-rose-500/15 via-cyan-500/10 to-transparent p-4 pr-12">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30">
                      <Box className="size-5" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <DialogTitle>{selected.name}</DialogTitle>
                      <DialogDescription className="font-mono text-xs">
                        {providerName(selected)} · {selected.image}
                      </DialogDescription>
                      <div className="pt-1">
                        <ContainerStatusBadge status={selected.status} />
                      </div>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={buildAddServiceHref(selected)}>
                      <LayoutDashboard />
                      Add to dashboard
                    </Link>
                  </Button>
                </div>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto bg-muted/10 p-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-3">
                  <DetailRow label="State" value={selected.status} tone="rose" />
                  {selected.summary ? <DetailRow label="Status" value={selected.summary} tone="cyan" /> : null}
                  {selected.createdAt ? (
                    <DetailRow
                      label="Created"
                      value={new Date(selected.createdAt).toLocaleString()}
                      tone="amber"
                    />
                  ) : null}
                </div>
                {selected.ports?.length ? (
                  <>
                    <Separator />
                    <div className="space-y-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <div className="font-mono text-xs uppercase tracking-wide text-cyan-200/80">
                        Ports
                      </div>
                      <ul className="space-y-1">
                        {selected.ports.map((port, index) => (
                          <li key={`${port}-${index}`} className="font-mono text-xs">
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
                    <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-mono text-xs uppercase tracking-wide text-amber-200/80">
                          Labels
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowLabels((current) => !current)}
                        >
                          {showLabels ? "Hide labels" : "Show labels"}
                        </Button>
                      </div>
                      {showLabels ? (
                        <ul className="space-y-1">
                          {Object.entries(selected.labels).map(([key, value]) => (
                            <li key={key} className="font-mono text-xs break-all">
                              {key}={value}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </>
                ) : null}
                <Separator />
                <div className="space-y-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-mono text-xs uppercase tracking-wide text-emerald-200/80">
                      Logs
                    </div>
                    {logs === null ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void loadLogs(selected)}
                        disabled={logsLoading}
                      >
                        <FileText />
                        {logsLoading ? "Loading..." : "Load logs"}
                      </Button>
                    ) : null}
                  </div>
                  {logs !== null ? (
                    <div className="flex flex-wrap items-end gap-2">
                      <SelectField label="Lines">
                        <select
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                          value={logLineCount}
                          onChange={(event) =>
                            setLogLineCount(Number(event.target.value) as LogLineCount)
                          }
                        >
                          {logLineOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </SelectField>
                      <SelectField label="Filter">
                        <select
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                          value={logLevelFilter}
                          onChange={(event) =>
                            setLogLevelFilter(event.target.value as LogLevelFilter)
                          }
                        >
                          {logLevelOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </SelectField>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void loadLogs(selected)}
                        disabled={logsLoading}
                      >
                        <FileText />
                        {logsLoading ? "Loading..." : "Reload"}
                      </Button>
                    </div>
                  ) : null}
                  {logsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading logs...</p>
                  ) : logsError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {logsError}
                    </p>
                  ) : logs !== null ? (
                    visibleLogs ? (
                      <pre className="max-h-72 overflow-auto rounded-lg border border-emerald-500/20 bg-background/70 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
                        {visibleLogs}
                      </pre>
                    ) : (
                      <p className="text-sm text-muted-foreground">No matching logs returned.</p>
                    )
                  ) : null}
                </div>
              </div>
              {actionsEnabled && selected && containerActionsEnabled(selected) ? (
                <div className="flex flex-wrap gap-2 border-t border-rose-500/20 bg-rose-500/5 p-4">
                  {isStopped(selected.status) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSubmittedAction(null);
                        setPendingAction("start");
                      }}
                      disabled={actionPending}
                    >
                      <Play />
                      Start
                    </Button>
                  ) : null}
                  {isRunning(selected.status) ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSubmittedAction(null);
                          setPendingAction("stop");
                        }}
                        disabled={actionPending}
                      >
                        <Square />
                        Stop
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSubmittedAction(null);
                          setPendingAction("restart");
                        }}
                        disabled={actionPending}
                      >
                        <RotateCcw />
                        Restart
                      </Button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selected && pendingAction)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
            setSubmittedAction(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {selected && pendingAction ? (
            actionState.ok &&
            actionState.message &&
            submittedAction === pendingAction &&
            !actionPending ? (
              <>
                <DialogHeader>
                  <DialogTitle>Action complete</DialogTitle>
                  <DialogDescription>{actionState.message}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={() => {
                      setPendingAction(null);
                      closeContainer();
                    }}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>{actionTitle(pendingAction)}</DialogTitle>
                  <DialogDescription>
                    {actionDescription(pendingAction, selected.name)}
                  </DialogDescription>
                </DialogHeader>
                {actionState.message && !actionState.ok ? (
                  <p className="text-sm text-destructive" role="alert">
                    {actionState.message}
                  </p>
                ) : null}
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPendingAction(null)}
                    disabled={actionPending}
                  >
                    Cancel
                  </Button>
                  <form
                    action={actionFormAction}
                    onSubmit={() => setSubmittedAction(pendingAction)}
                  >
                    <input type="hidden" name="containerId" value={selected.id} />
                    <input type="hidden" name="providerId" value={selected.providerId ?? ""} />
                    <input type="hidden" name="action" value={pendingAction} />
                    <Button
                      type="submit"
                      variant={pendingAction === "stop" ? "destructive" : "default"}
                      disabled={actionPending}
                    >
                      {actionPending ? "Working..." : actionConfirmLabel(pendingAction)}
                    </Button>
                  </form>
                </DialogFooter>
              </>
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function containerActionsEnabled(container: ProviderResource) {
  return container.meta?.providerReadOnly !== "true";
}
function providerName(container: ProviderResource) {
  return container.meta?.providerName || "Docker";
}
function filterLogs(logs: string, filter: LogLevelFilter) {
  if (!logs || filter === "all") {
    return logs;
  }

  return logs
    .split(/\r?\n/)
    .filter((line) => {
      const isWarning = warningPattern.test(line);
      const isError = errorPattern.test(line);

      if (filter === "warn") return isWarning;
      if (filter === "error") return isError;
      return !isWarning && !isError;
    })
    .join("\n");
}

function buildAddServiceHref(container: ProviderResource) {
  const defaults = buildContainerServiceDefaults(container);
  const params = new URLSearchParams({ add: "1", ...defaults });

  return `/services?${params.toString()}`;
}
function actionTitle(action: ContainerAction) {
  if (action === "start") return "Start container";
  if (action === "stop") return "Stop container";
  return "Restart container";
}

function actionDescription(action: ContainerAction, name: string) {
  if (action === "start") {
    return `Start "${name}"? The container will begin running on your Docker host.`;
  }
  if (action === "stop") {
    return `Stop "${name}"? Running processes inside the container will be stopped.`;
  }
  return `Restart "${name}"? The container will stop and start again.`;
}

function actionConfirmLabel(action: ContainerAction) {
  if (action === "start") return "Start container";
  if (action === "stop") return "Stop container";
  return "Restart container";
}

function SelectField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-xs text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

function DetailRow({
  label,
  value,
  tone = "rose",
}: {
  label: string;
  value: string;
  tone?: "rose" | "cyan" | "amber";
}) {
  const toneClass = {
    rose: "border-rose-500/20 bg-rose-500/5 text-rose-200/80",
    cyan: "border-cyan-500/20 bg-cyan-500/5 text-cyan-200/80",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-200/80",
  }[tone];

  return (
    <div className={cn("space-y-1 rounded-lg border p-3", toneClass)}>
      <div className="font-mono text-xs uppercase tracking-wide">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}
