"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ContainerStatsRequestState } from "@/lib/providers/container-detail-request";
import type { ContainerStatsSnapshot } from "@/lib/providers/types";
import { cn } from "@/lib/utils";

const LIVE_INTERVAL_MS = 5000;
const MAX_CONSECUTIVE_FAILURES = 3;

export function ContainerMetricsPanel({
  state,
  onLoad,
  disconnected = false,
  className,
}: {
  state: ContainerStatsRequestState;
  onLoad: (refresh: boolean) => void | Promise<void>;
  disconnected?: boolean;
  className?: string;
}) {
  const [live, setLive] = useState(false);
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible"
  );
  const consecutiveFailures = useRef(0);
  const loadedOnce = useRef(false);
  const lastCountedState = useRef<ContainerStatsRequestState | null>(null);

  useEffect(() => {
    if (loadedOnce.current) {
      return;
    }
    loadedOnce.current = true;
    void onLoad(false);
  }, [onLoad]);

  useEffect(() => {
    function onVisibility() {
      setTabVisible(document.visibilityState === "visible");
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (lastCountedState.current === state) {
      return;
    }
    lastCountedState.current = state;

    if (state.kind === "ok") {
      consecutiveFailures.current = 0;
    } else if (
      state.kind === "error" ||
      state.kind === "network-error" ||
      state.kind === "unavailable" ||
      state.kind === "not-found" ||
      state.kind === "unauthenticated"
    ) {
      consecutiveFailures.current += 1;
    }
  }, [state]);

  const liveActive = live && !disconnected;

  function handleLiveChange(next: boolean) {
    if (next) {
      consecutiveFailures.current = 0;
    }
    setLive(next);
  }

  function handleRefresh() {
    consecutiveFailures.current = 0;
    void onLoad(true);
  }

  useEffect(() => {
    if (!liveActive || !tabVisible) {
      return;
    }

    const timer = window.setInterval(() => {
      if (consecutiveFailures.current >= MAX_CONSECUTIVE_FAILURES) {
        setLive(false);
        return;
      }
      void onLoad(true);
    }, LIVE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [liveActive, tabVisible, onLoad]);

  const stats = state.kind === "ok" ? state.stats : null;
  const errorMessage = metricsErrorMessage(state);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Activity className="size-4 text-cyan-300" />
          Resource snapshot
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="metrics-live"
              checked={liveActive}
              onCheckedChange={handleLiveChange}
              disabled={disconnected}
            />
            <Label htmlFor="metrics-live" className="text-xs">
              Live
            </Label>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={state.kind === "loading" || disconnected}
          >
            <RefreshCw className={state.kind === "loading" ? "animate-spin" : undefined} />
            Refresh
          </Button>
        </div>
      </div>

      {disconnected ? (
        <p className="text-sm text-muted-foreground">
          Metrics unavailable while the endpoint is disconnected.
        </p>
      ) : state.kind === "loading" && !stats ? (
        <p className="text-sm text-muted-foreground">Loading metrics…</p>
      ) : errorMessage && !stats ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : stats ? (
        <>
          {errorMessage ? (
            <p className="text-xs text-amber-300" role="status">
              {errorMessage} Showing last successful sample.
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricTile label="CPU" value={formatPercent(stats.cpuPercent)} tone="rose" />
            <MetricTile
              label="Memory"
              value={formatMemory(stats)}
              detail={formatPercent(stats.memoryPercent)}
              tone="cyan"
            />
            <MetricTile
              label="Network RX / TX"
              value={`${formatBytes(stats.networkRxBytes)} / ${formatBytes(stats.networkTxBytes)}`}
              tone="emerald"
            />
            <MetricTile
              label="Block read / write"
              value={`${formatBytes(stats.blockReadBytes)} / ${formatBytes(stats.blockWriteBytes)}`}
              tone="amber"
            />
            <MetricTile label="PIDs" value={formatNumber(stats.pids)} tone="rose" />
            <MetricTile
              label="Sampled"
              value={formatTimestamp(stats.sampledAt)}
              tone="cyan"
            />
          </div>
          {live ? (
            <p className="text-[0.65rem] text-muted-foreground">
              Live refresh every 5s while this tab is visible. Stops after three consecutive
              failures.
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No metrics available.</p>
      )}
    </div>
  );
}

function metricsErrorMessage(state: ContainerStatsRequestState) {
  switch (state.kind) {
    case "unavailable":
    case "not-found":
    case "error":
      return state.message;
    case "unauthenticated":
      return "Your session expired. Sign in again to view metrics.";
    case "network-error":
      return "Could not load container metrics.";
    default:
      return null;
  }
}

function MetricTile({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string | null;
  tone: "rose" | "cyan" | "amber" | "emerald";
}) {
  const toneClass = {
    rose: "border-rose-500/20 bg-rose-500/5 text-rose-200/80",
    cyan: "border-cyan-500/20 bg-cyan-500/5 text-cyan-200/80",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-200/80",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-200/80",
  }[tone];

  return (
    <div className={cn("space-y-1 rounded-lg border p-3", toneClass)}>
      <div className="font-mono text-[0.65rem] uppercase tracking-wide">{label}</div>
      <div className="text-sm text-foreground">{value}</div>
      {detail ? <div className="text-xs text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

function formatMemory(stats: ContainerStatsSnapshot) {
  return `${formatBytes(stats.memoryUsageBytes)} / ${formatBytes(stats.memoryLimitBytes)}`;
}

export function formatBytes(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let amount = Math.max(0, value);
  let unit = 0;
  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || amount >= 100 ? 0 : amount >= 10 ? 1 : 2;
  return `${amount.toFixed(digits)} ${units[unit]}`;
}

function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
}

function formatNumber(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return String(Math.round(value));
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleTimeString();
}
