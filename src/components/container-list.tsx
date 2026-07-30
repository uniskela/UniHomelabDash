"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  Box,
  Eye,
  FileText,
  LayoutDashboard,
  Play,
  RotateCcw,
  Search,
  Settings,
  ShieldAlert,
  Square,
  X,
} from "lucide-react";
import { ContainerCard } from "@/components/container-card";
import { ControlSelect } from "@/components/control-select";
import { ContainerStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { StatTile, StatTileGrid } from "@/components/stat-tile";
import { useContainerViewPreferences } from "@/components/use-container-view-preferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  containerHideKey,
  containerProviderCaption,
  filterContainers,
  groupContainers,
  isRunningContainer,
  isStoppedContainer,
  listContainerHostOptions,
  splitHiddenContainers,
  type ContainerStatusFilter,
} from "@/lib/providers/container-filters";
import {
  defaultContainerViewPreferences,
  toggleHiddenContainer,
  type ContainerGroupMode,
  type ContainerViewMode,
  type ContainerViewPreferences,
} from "@/lib/providers/container-preferences";
import { containerQueryPrefixes } from "@/lib/providers/container-query";
import type { ProviderResource } from "@/lib/providers/types";
import { cn } from "@/lib/utils";

type ContainerAction = "start" | "stop" | "restart";

type LogLineCount = 10 | 50 | 100 | 200 | 500;
type LogLevelFilter = "all" | "log" | "warn" | "error";

const filterOptions: Array<{ id: ContainerStatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "running", label: "Running" },
  { id: "stopped", label: "Stopped" },
];

const viewOptions: Array<{ value: ContainerViewMode; label: string }> = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
  { value: "tiles", label: "Tiles" },
];

const groupOptions: Array<{ value: ContainerGroupMode; label: string }> = [
  { value: "none", label: "No grouping" },
  { value: "host", label: "Host" },
  { value: "status", label: "Status" },
  { value: "provider", label: "Provider" },
];

const viewClasses: Record<ContainerViewMode, string> = {
  list: "grid gap-3",
  grid: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
  tiles: "grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4",
};

const logLineOptions: Array<{ value: string; label: string }> = [10, 50, 100, 200, 500].map(
  (count) => ({ value: String(count), label: String(count) })
);

const logLevelOptions: Array<{ value: LogLevelFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "log", label: "Log" },
  { value: "warn", label: "Warn" },
  { value: "error", label: "Error" },
];

const warningPattern = /\bwarn(?:ing)?\b/i;
const errorPattern = /\b(?:error|err|fatal|panic|exception)\b/i;

export function ContainerList({
  containers,
  error,
  warning,
  enabled,
  actionsEnabled = false,
  initialPreferences = defaultContainerViewPreferences,
  onRefresh,
}: {
  containers: ProviderResource[];
  error?: string | null;
  warning?: string | null;
  enabled: boolean;
  actionsEnabled?: boolean;
  initialPreferences?: ContainerViewPreferences;
  onRefresh?: () => void;
}) {
  const [selected, setSelected] = useState<ProviderResource | null>(null);
  const [pendingAction, setPendingAction] = useState<ContainerAction | null>(null);
  const [submittedAction, setSubmittedAction] = useState<ContainerAction | null>(null);
  const [filter, setFilter] = useState<ContainerStatusFilter>("all");
  const [hostFilter, setHostFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [showSearchTips, setShowSearchTips] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState<string | null>(null);
  const { preferences, saveError, update } = useContainerViewPreferences(initialPreferences);
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

  useEffect(() => {
    if (actionState.ok && submittedAction) {
      onRefresh?.();
    }
  }, [actionState.ok, actionState.message, submittedAction, onRefresh]);

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
      const params = new URLSearchParams({
        tail: String(logLineCount),
        providerType: container.providerType,
      });
      if (container.providerId) {
        params.set("providerId", container.providerId);
      }
      const response = await fetch(
        `/api/containers/${encodeURIComponent(container.id)}/logs?${params.toString()}`
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

  const hostOptions = useMemo(
    () => [
      { value: "all", label: "All hosts" },
      ...listContainerHostOptions(containers).map((host) => ({ value: host, label: host })),
    ],
    [containers]
  );

  const { visible, concealed } = useMemo(
    () => splitHiddenContainers(containers, preferences.hidden),
    [containers, preferences.hidden]
  );

  const scopedContainers = showHidden ? containers : visible;

  const filteredContainers = useMemo(
    () =>
      filterContainers(scopedContainers, {
        status: filter,
        host: hostFilter === "all" ? "" : hostFilter,
        search: searchQuery,
      }),
    [scopedContainers, filter, hostFilter, searchQuery]
  );

  const groups = useMemo(
    () => groupContainers(filteredContainers, preferences.groupBy),
    [filteredContainers, preferences.groupBy]
  );

  const hiddenKeys = useMemo(() => new Set(preferences.hidden), [preferences.hidden]);

  const visibleLogs = useMemo(() => filterLogs(logs ?? "", logLevelFilter), [logs, logLevelFilter]);

  const filtersActive = filter !== "all" || hostFilter !== "all" || searchQuery.trim().length > 0;

  function setView(view: ContainerViewMode) {
    update({ ...preferences, view });
  }

  function setGroupBy(groupBy: ContainerGroupMode) {
    update({ ...preferences, groupBy });
  }

  function toggleHidden(container: ProviderResource) {
    update({
      ...preferences,
      hidden: toggleHiddenContainer(preferences.hidden, containerHideKey(container)),
    });
  }

  function unhideAll() {
    update({ ...preferences, hidden: [] });
    setShowHidden(false);
  }

  if (!enabled) {
    return (
      <EmptyState
        icon={Box}
        title="No container integrations"
        description="Enable Docker or Portainer in Settings to list containers here."
        actionLabel="Open integration settings"
        actionHref="/settings"
      />
    );
  }

  if (error && containers.length === 0) {
    return (
      <EmptyState
        icon={Settings}
        title="Cannot reach containers"
        description={`${error} Check your Docker or Portainer integration settings and try again.`}
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
        description="Configured integrations responded successfully but returned an empty container list."
      />
    );
  }

  const runningCount = visible.filter((item) => isRunningContainer(item.status)).length;
  const stoppedCount = visible.length - runningCount;

  return (
    <>
      {warning && dismissedWarning !== warning ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-100/90"
          role="status"
        >
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />
          <p className="min-w-0 flex-1">
            Some integrations failed while loading containers. Healthy results are still shown.{" "}
            {warning}
          </p>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="-mt-1 -mr-1 shrink-0 text-amber-100/70 hover:bg-amber-500/10 hover:text-amber-100"
            onClick={() => setDismissedWarning(warning)}
            aria-label="Dismiss container warning"
          >
            <X />
          </Button>
        </div>
      ) : null}
      <StatTileGrid>
        <StatTile
          icon={<Box />}
          label="Total"
          value={visible.length.toString()}
          detail={concealed.length > 0 ? `${concealed.length} hidden` : undefined}
        />
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

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search containers, or try host:nas name:immich"
              aria-label="Search containers"
              className="pl-8"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setShowSearchTips((current) => !current)}
              aria-expanded={showSearchTips}
            >
              {showSearchTips ? "Hide search tips" : "Search tips"}
            </Button>
          </div>
          {showSearchTips ? <SearchTips /> : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-wrap gap-2 sm:pb-0.5">
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

          <ControlSelect
            label="Host"
            value={hostFilter}
            options={hostOptions}
            onChange={setHostFilter}
            className="min-w-[10rem] flex-1 sm:max-w-xs"
          />
          <ControlSelect
            label="View as"
            value={preferences.view}
            options={viewOptions}
            onChange={setView}
            className="min-w-[7rem]"
          />
          <ControlSelect
            label="Grouped by"
            value={preferences.groupBy}
            options={groupOptions}
            onChange={setGroupBy}
            className="min-w-[9rem]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          {filtersActive || showHidden ? (
            <span>
              Showing {filteredContainers.length} of {scopedContainers.length} containers
              {hostFilter !== "all" ? ` on ${hostFilter}` : ""}.
            </span>
          ) : null}
          {concealed.length > 0 ? (
            <>
              <span>
                {concealed.length} {concealed.length === 1 ? "container" : "containers"} hidden.
              </span>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => setShowHidden((current) => !current)}
              >
                <Eye />
                {showHidden ? "Hide hidden" : "Show hidden"}
              </Button>
              <Button type="button" size="xs" variant="ghost" onClick={unhideAll}>
                Unhide all
              </Button>
            </>
          ) : null}
          {saveError ? (
            <span className="text-amber-300" role="status">
              {saveError}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.key} className="space-y-3">
            {group.label ? (
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-medium capitalize">{group.label}</h2>
                <span className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-foreground">
                  {group.containers.length}
                </span>
                <span className="h-px flex-1 bg-border/60" />
              </div>
            ) : null}
            <div className={viewClasses[preferences.view]}>
              {group.containers.map((container) => (
                <ContainerCard
                  key={`${container.providerId ?? container.providerType}-${container.id}`}
                  container={container}
                  view={preferences.view}
                  hidden={hiddenKeys.has(containerHideKey(container))}
                  onOpen={() => openContainer(container)}
                  onToggleHidden={() => toggleHidden(container)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {filteredContainers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {concealed.length > 0 && !showHidden
            ? "No containers match this filter. Some containers are hidden."
            : "No containers match this filter."}
        </p>
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
                        {containerProviderCaption(selected)} · {selected.image}
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
                      <ControlSelect
                        label="Lines"
                        value={String(logLineCount)}
                        options={logLineOptions}
                        onChange={(value) => setLogLineCount(Number(value) as LogLineCount)}
                      />
                      <ControlSelect
                        label="Filter"
                        value={logLevelFilter}
                        options={logLevelOptions}
                        onChange={setLogLevelFilter}
                      />
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
                  {isStoppedContainer(selected.status) ? (
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
                  {isRunningContainer(selected.status) ? (
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

function SearchTips() {
  return (
    <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
      <p>
        Type plain text to search names, images, hosts, and ports. Add a prefix to target one
        field, and combine as many terms as you like.
      </p>
      <div className="flex flex-wrap gap-1">
        {containerQueryPrefixes.map((prefix) => (
          <code
            key={prefix}
            className="rounded-md bg-background px-1.5 py-0.5 font-mono text-[0.65rem] text-foreground"
          >
            {prefix}
          </code>
        ))}
      </div>
      <ul className="space-y-1">
        <li>
          <code className="font-mono text-foreground">host:nas status:running</code> — running
          containers on hosts matching &quot;nas&quot;.
        </li>
        <li>
          <code className="font-mono text-foreground">image:postgres -name:test</code> — Postgres
          images, excluding names containing &quot;test&quot;.
        </li>
        <li>
          <code className="font-mono text-foreground">name:&quot;media server&quot;</code> — quote
          values that contain spaces.
        </li>
      </ul>
    </div>
  );
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
