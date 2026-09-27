"use client";

import Link from "next/link";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Box, LayoutDashboard, Play, RotateCcw, Settings, Square } from "lucide-react";
import { ContainerLogReader, type LogTailCount } from "@/components/container-log-reader";
import { ContainerMetricsPanel } from "@/components/container-metrics-panel";
import { Disclosure } from "@/components/disclosure";
import { ContainerStatusBadge, StatusBadge } from "@/components/status-badge";
import type { StatusTone } from "@/components/status-tone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initialProviderActionState } from "@/lib/providers/action-state";
import { executeContainerAction } from "@/lib/providers/actions";
import {
  ContainerDetailRequestController,
  containerInspectAnnouncement,
  type ContainerInspectRequestState,
  type ContainerLogsRequestState,
  type ContainerStatsRequestState,
} from "@/lib/providers/container-detail-request";
import {
  containerProviderCaption,
  isRunningContainer,
  isStartableContainer,
} from "@/lib/providers/container-filters";
import { buildContainerServiceDefaults } from "@/lib/providers/docker/dashboard-prefill";
import type {
  ContainerDetailResource,
  ContainerHealthStatus,
  ContainerLabelEntry,
  ProviderResource,
} from "@/lib/providers/types";
import { cn } from "@/lib/utils";

type ContainerAction = "start" | "stop" | "restart";
type DrawerTab = "overview" | "metrics" | "logs";

export function ContainerControlDrawer({
  container,
  open,
  onOpenChange,
  actionsEnabled = false,
  onActionSuccess,
}: {
  container: ProviderResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionsEnabled?: boolean;
  onActionSuccess?: () => void;
}) {
  const [tab, setTab] = useState<DrawerTab>("overview");
  const [controller] = useState(() => new ContainerDetailRequestController());
  const [inspectState, setInspectState] = useState<ContainerInspectRequestState>({
    kind: "idle",
  });
  const [statsState, setStatsState] = useState<ContainerStatsRequestState>({ kind: "idle" });
  const [logsState, setLogsState] = useState<ContainerLogsRequestState>({ kind: "idle" });
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [metricsVisited, setMetricsVisited] = useState(false);
  const [logTail, setLogTail] = useState<LogTailCount>(200);
  const [logTimestamps, setLogTimestamps] = useState(true);
  const [pendingAction, setPendingAction] = useState<ContainerAction | null>(null);
  const [submittedAction, setSubmittedAction] = useState<ContainerAction | null>(null);
  const [actionState, actionFormAction, actionPending] = useActionState(
    executeContainerAction,
    initialProviderActionState
  );
  const containerRef = useRef(container);

  useEffect(() => {
    containerRef.current = container;
  }, [container]);

  const selectionKey = container
    ? `${container.providerId ?? container.providerType}:${container.id}`
    : "";

  const resetTransient = useCallback(() => {
    setInspectState({ kind: "idle" });
    setStatsState({ kind: "idle" });
    setLogsState({ kind: "idle" });
    setLogsLoaded(false);
    setMetricsVisited(false);
    setTab("overview");
    setPendingAction(null);
    setSubmittedAction(null);
  }, []);

  useEffect(() => {
    if (!open || !selectionKey) {
      controller.abort();
      return;
    }

    const selected = containerRef.current;
    if (!selected) {
      return;
    }

    resetTransient();
    void controller.loadInspect(selected, false, setInspectState);

    return () => {
      controller.abort();
    };
  }, [controller, open, selectionKey, resetTransient]);

  useEffect(() => {
    if (actionState.ok && submittedAction) {
      onActionSuccess?.();
      const selected = containerRef.current;
      if (selected) {
        void controller.loadInspect(selected, true, setInspectState);
      }
    }
  }, [actionState.ok, actionState.message, submittedAction, onActionSuccess, controller]);

  const loadStats = useCallback(
    (refresh: boolean) => {
      const selected = containerRef.current;
      if (!selected) {
        return;
      }
      return controller.loadStats(selected, refresh, setStatsState);
    },
    [controller]
  );

  const loadLogs = useCallback(
    (nextTail = logTail, nextTimestamps = logTimestamps) => {
      const selected = containerRef.current;
      if (!selected) {
        return;
      }
      setLogsLoaded(true);
      return controller.loadLogs(
        selected,
        { tail: nextTail, timestamps: nextTimestamps },
        setLogsState
      );
    },
    [controller, logTail, logTimestamps]
  );

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      controller.abort();
      resetTransient();
    }
    onOpenChange(nextOpen);
  }

  function handleTabChange(value: string) {
    const next = value as DrawerTab;
    setTab(next);
    if (next === "metrics") {
      setMetricsVisited(true);
    }
    if (next === "logs" && !logsLoaded && container) {
      void loadLogs();
    }
  }

  function handleTailChange(tail: LogTailCount) {
    setLogTail(tail);
    void loadLogs(tail, logTimestamps);
  }

  function handleTimestampsChange(timestamps: boolean) {
    setLogTimestamps(timestamps);
    void loadLogs(logTail, timestamps);
  }

  const detail = inspectState.kind === "ok" ? inspectState.detail : null;
  const disconnected =
    inspectState.kind === "unavailable" && inspectState.reason === "endpoint_disconnected";
  const showActions =
    actionsEnabled &&
    container &&
    container.meta?.providerReadOnly !== "true";

  const logsError =
    logsState.kind === "error"
      ? logsState.message
      : logsState.kind === "unauthenticated"
        ? "Your session expired. Sign in again to view logs."
        : logsState.kind === "network-error"
          ? "Could not load container logs."
          : null;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="data-[side=right]:w-full gap-0 p-0 sm:max-w-xl lg:max-w-2xl"
        >
          {container ? (
            <>
              <SheetHeader className="gap-3 border-b pr-12">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/60"
                  >
                    <Box className="size-5" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <SheetTitle className="truncate text-lg" title={container.name}>
                      {container.name}
                    </SheetTitle>
                    <SheetDescription className="truncate font-mono text-xs">
                      {containerProviderCaption(container)} · {container.image}
                    </SheetDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <ContainerStatusBadge status={detail?.state ?? container.status} />
                  <Button asChild size="sm" variant="outline">
                    <Link href={buildAddServiceHref(container)}>
                      <LayoutDashboard aria-hidden />
                      Add to dashboard
                    </Link>
                  </Button>
                </div>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                  {containerInspectAnnouncement(inspectState)}
                </p>
                <Tabs value={tab} onValueChange={handleTabChange} className="gap-0">
                  <div className="border-b border-border/70 px-4 pt-3">
                    <TabsList className="w-full">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="metrics">Metrics</TabsTrigger>
                      <TabsTrigger value="logs">Logs</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="overview" className="space-y-4 p-4">
                    <OverviewPanel state={inspectState} fallback={container} />
                  </TabsContent>
                  <TabsContent value="metrics" className="p-4">
                    {metricsVisited || tab === "metrics" ? (
                      <ContainerMetricsPanel
                        state={statsState}
                        onLoad={loadStats}
                        disconnected={disconnected}
                        active={tab === "metrics"}
                      />
                    ) : null}
                  </TabsContent>
                  <TabsContent value="logs" className="p-4">
                    <ContainerLogReader
                      logs={logsState.kind === "ok" ? logsState.logs : logsLoaded ? "" : null}
                      loading={logsState.kind === "loading"}
                      error={logsError}
                      onReload={() => void loadLogs()}
                      tail={logTail}
                      onTailChange={handleTailChange}
                      timestamps={logTimestamps}
                      onTimestampsChange={handleTimestampsChange}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {showActions ? (
                <SheetFooter className="flex-row flex-wrap gap-2 border-t bg-muted/20 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  {isStartableContainer(detail?.state ?? container.status) ? (
                    <Button
                      type="button"
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
                  {isRunningContainer(detail?.state ?? container.status) ? (
                    <>
                      <Button
                        type="button"
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
                </SheetFooter>
              ) : (
                <SheetFooter className="flex-row flex-wrap items-center justify-between gap-2 border-t bg-muted/20 pb-[calc(1rem+env(safe-area-inset-bottom))] text-xs text-muted-foreground">
                  <p>Read-only. Start, stop, and restart are off for this integration.</p>
                  <Button asChild size="sm" variant="ghost">
                    <Link href="/settings#integrations">
                      <Settings aria-hidden />
                      Integration settings
                    </Link>
                  </Button>
                </SheetFooter>
              )}
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(container && pendingAction)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPendingAction(null);
            setSubmittedAction(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {container && pendingAction ? (
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
                  <Button type="button" onClick={() => setPendingAction(null)}>
                    Done
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>{actionTitle(pendingAction)}</DialogTitle>
                  <DialogDescription asChild>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>{actionEffect(pendingAction)}</p>
                      <dl className="space-y-1 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs">
                        <ConfirmRow label="Container" value={container.name} />
                        <ConfirmRow
                          label="Provider"
                          value={container.meta?.providerName ?? container.providerType}
                        />
                        {container.meta?.endpointName ? (
                          <ConfirmRow label="Endpoint" value={container.meta.endpointName} />
                        ) : null}
                        <ConfirmRow
                          label="Current state"
                          value={detail?.state ?? container.status}
                        />
                      </dl>
                    </div>
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
                    <input type="hidden" name="containerId" value={container.id} />
                    <input type="hidden" name="providerId" value={container.providerId ?? ""} />
                    <input type="hidden" name="action" value={pendingAction} />
                    <Button
                      type="submit"
                      variant={pendingAction === "stop" ? "destructive" : "default"}
                      disabled={actionPending}
                    >
                      {actionPending ? "Working…" : actionConfirmLabel(pendingAction)}
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

function OverviewPanel({
  state,
  fallback,
}: {
  state: ContainerInspectRequestState;
  fallback: ProviderResource;
}) {
  if (state.kind === "loading" || state.kind === "idle") {
    return (
      <>
        <p role="status" className="sr-only">
          Loading container details…
        </p>
        <div aria-hidden className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      </>
    );
  }

  if (state.kind === "unauthenticated") {
    return (
      <p className="text-sm text-destructive" role="alert">
        Your session expired. Sign in again to view container details.
      </p>
    );
  }

  if (state.kind === "not-found" || state.kind === "error" || state.kind === "unavailable") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          {"message" in state ? state.message : "Could not load container details."}
        </p>
        <FallbackOverview container={fallback} />
      </div>
    );
  }

  if (state.kind === "network-error") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          Could not load container details.
        </p>
        <FallbackOverview container={fallback} />
      </div>
    );
  }

  return <DetailOverview detail={state.detail} />;
}

function FallbackOverview({ container }: { container: ProviderResource }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <DetailRow label="State" value={container.status} />
      {container.summary ? <DetailRow label="Status" value={container.summary} /> : null}
      {container.createdAt ? (
        <DetailRow label="Created" value={new Date(container.createdAt).toLocaleString()} />
      ) : null}
      {container.ports?.length ? (
        <DetailRow label="Ports" value={container.ports.join(", ")} mono />
      ) : null}
    </dl>
  );
}

const healthTones: Record<ContainerHealthStatus, StatusTone> = {
  healthy: "success",
  starting: "warning",
  unhealthy: "danger",
  none: "neutral",
  unknown: "neutral",
};

const healthLabels: Record<ContainerHealthStatus, string> = {
  healthy: "Healthy",
  starting: "Starting",
  unhealthy: "Unhealthy",
  none: "No health check",
  unknown: "Unknown",
};

function DetailOverview({ detail }: { detail: ContainerDetailResource }) {
  return (
    <div className="space-y-4 text-sm">
      <dl className="grid gap-3 sm:grid-cols-2">
        <DetailRow
          label="Health"
          value={
            <StatusBadge
              tone={healthTones[detail.health] ?? "neutral"}
              label={healthLabels[detail.health] ?? detail.health}
            />
          }
        />
        <DetailRow label="Status" value={detail.status || "—"} />
        <DetailRow label="Image" value={detail.image} mono className="sm:col-span-2" />
        {detail.startedAt ? (
          <DetailRow label="Started" value={formatDate(detail.startedAt)} />
        ) : null}
        {detail.createdAt ? (
          <DetailRow label="Created" value={formatDate(detail.createdAt)} />
        ) : null}
        <DetailRow
          label="Ports"
          value={detail.ports.length ? detail.ports.join(", ") : "No published ports"}
          mono={detail.ports.length > 0}
          className="sm:col-span-2"
        />
      </dl>

      <Disclosure
        summary="Technical details"
        description="Restart policy, networks, mounts, limits, and labels."
      >
        <div className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Lifecycle" value={detail.state} />
            {detail.platform ? <DetailRow label="Platform" value={detail.platform} /> : null}
            {detail.restartPolicy ? (
              <DetailRow
                label="Restart policy"
                value={
                  detail.restartPolicy.maximumRetryCount != null
                    ? `${detail.restartPolicy.name} (max ${detail.restartPolicy.maximumRetryCount})`
                    : detail.restartPolicy.name
                }
              />
            ) : null}
            {detail.finishedAt ? (
              <DetailRow label="Finished" value={formatDate(detail.finishedAt)} />
            ) : null}
          </dl>

          <Section title="Networks">
            {detail.networks.length ? (
              <ul className="space-y-1">
                {detail.networks.map((network) => (
                  <li key={network} className="font-mono text-xs">
                    {network}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No networks reported.</p>
            )}
          </Section>

          <Section title="Mounts">
            {detail.mounts.length ? (
              <ul className="space-y-2">
                {detail.mounts.map((mount, index) => (
                  <li key={`${mount.destination}-${index}`} className="font-mono text-xs">
                    <span className="text-foreground">{mount.destination}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {mount.type}
                      {mount.readOnly ? " · read-only" : ""}
                      {mount.name ? ` · ${mount.name}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No safe mount metadata.</p>
            )}
          </Section>

          <Section title="Limits">
            <dl className="grid grid-cols-2 gap-2">
              <LimitRow label="Memory" value={formatLimitBytes(detail.limits.memoryBytes)} />
              <LimitRow label="nanoCPUs" value={formatLimitNumber(detail.limits.nanoCpus)} />
              <LimitRow label="CPU shares" value={formatLimitNumber(detail.limits.cpuShares)} />
              <LimitRow label="PIDs limit" value={formatLimitNumber(detail.limits.pidsLimit)} />
            </dl>
          </Section>

          <Section title="Labels">
            {detail.labels.length ? (
              <ul className="space-y-1">
                {detail.labels.map((entry) => (
                  <LabelRow key={entry.key} entry={entry} />
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No labels.</p>
            )}
          </Section>
        </div>
      </Disclosure>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      <div className="rounded-lg border border-border/70 bg-muted/10 p-3 text-foreground">
        {children}
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  className,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("min-w-0 space-y-1 rounded-lg border border-border/70 bg-muted/10 p-3", className)}
    >
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-foreground", mono ? "font-mono text-xs break-all" : "break-words")}>
        {value}
      </dd>
    </div>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-xs">{value}</dd>
    </div>
  );
}

function LabelRow({ entry }: { entry: ContainerLabelEntry }) {
  return (
    <li className="font-mono text-xs break-all">
      {entry.visible && entry.value ? `${entry.key}=${entry.value}` : entry.key}
      {!entry.visible ? (
        <span className="ml-2 text-muted-foreground">(value hidden)</span>
      ) : null}
    </li>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
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

function actionEffect(action: ContainerAction) {
  if (action === "start") {
    return "The container will begin running on the selected Docker/Portainer endpoint.";
  }
  if (action === "stop") {
    return "Running processes inside the container will be stopped.";
  }
  return "The container will stop and start again.";
}

function actionConfirmLabel(action: ContainerAction) {
  if (action === "start") return "Start container";
  if (action === "stop") return "Stop container";
  return "Restart container";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatLimitBytes(value: number | null) {
  if (value == null) return "—";
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)} GiB`;
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MiB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${value} B`;
}

function formatLimitNumber(value: number | null) {
  return value == null ? "—" : String(value);
}
