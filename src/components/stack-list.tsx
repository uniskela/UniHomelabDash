"use client";

import { useMemo, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Layers3,
  RefreshCw,
  Search,
  Settings,
  Unplug,
} from "lucide-react";
import { ControlSelect } from "@/components/control-select";
import { EmptyState } from "@/components/empty-state";
import { InlineNotice } from "@/components/inline-notice";
import { StackDetailSheet } from "@/components/stack-detail-sheet";
import { StatTile, StatTileGrid } from "@/components/stat-tile";
import { StackStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filterStacks,
  getStackSummary,
  listStackEndpointOptions,
  type StackStatusFilter,
} from "@/lib/providers/stack-filters";
import type { StackResource } from "@/lib/providers/types";
import { cn } from "@/lib/utils";

const statusOptions: ReadonlyArray<{ value: StackStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "unknown", label: "Unknown" },
  { value: "unavailable", label: "Unavailable" },
];

export function StackList({
  stacks,
  error,
  warning,
  enabled,
  loading = false,
  onRefresh,
}: {
  stacks: StackResource[];
  error?: string | null;
  warning?: string | null;
  enabled: boolean;
  loading?: boolean;
  onRefresh?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StackStatusFilter>("all");
  const [endpoint, setEndpoint] = useState("all");
  const [dismissedWarning, setDismissedWarning] = useState<string | null>(null);
  const [selectedStackSnapshot, setSelectedStackSnapshot] = useState<StackResource | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [originatingElement, setOriginatingElement] = useState<HTMLElement | null>(null);

  const openStack = (stack: StackResource, element: HTMLElement) => {
    setOriginatingElement(element);
    setSelectedStackSnapshot(stack);
    setSheetOpen(true);
  };

  const selectedStack = useMemo(() => {
    if (!selectedStackSnapshot) {
      return null;
    }
    return stacks.find((stack) => stack.id === selectedStackSnapshot.id) ?? selectedStackSnapshot;
  }, [selectedStackSnapshot, stacks]);
  const summary = useMemo(() => getStackSummary(stacks), [stacks]);
  const endpointOptions = useMemo(
    () => [
      { value: "all", label: "All endpoints" },
      ...listStackEndpointOptions(stacks),
    ],
    [stacks]
  );
  const filtered = useMemo(
    () =>
      filterStacks(stacks, {
        status,
        endpoint: endpoint === "all" ? "" : endpoint,
        search,
      }),
    [endpoint, search, stacks, status]
  );
  const filtersActive = status !== "all" || endpoint !== "all" || search.trim().length > 0;

  if (!enabled) {
    return (
      <EmptyState
        icon={Layers3}
        title="No Portainer integrations"
        description="Enable a Portainer integration in Settings to list stacks here."
        actionLabel="Set up Portainer"
        actionHref="/settings#integrations"
      />
    );
  }

  if (error && stacks.length === 0) {
    return (
      <EmptyState
        icon={Settings}
        title="Cannot reach stacks"
        description={`${error} Check your Portainer integration settings and try again.`}
        actionLabel="Review integrations"
        actionHref="/settings#integrations"
      />
    );
  }

  if (stacks.length === 0) {
    return (
      <EmptyState
        icon={Layers3}
        title="No stacks found"
        description="Configured Portainer integrations responded successfully but returned no stacks on supported Docker endpoints."
      />
    );
  }

  return (
    <div className="space-y-6">
      {warning && dismissedWarning !== warning ? (
        <InlineNotice
          onDismiss={() => setDismissedWarning(warning)}
          dismissLabel="Dismiss stack warning"
        >
          Some Portainer integrations failed. Healthy stack results are still shown. {warning}
        </InlineNotice>
      ) : null}

      <StatTileGrid label="Stack summary" className="lg:grid-cols-5">
        <StatTile icon={<Layers3 />} label="Total" value={summary.total.toString()} />
        <StatTile
          icon={<CircleCheck />}
          label="Active"
          value={summary.active.toString()}
          tone={summary.active > 0 ? "success" : "neutral"}
        />
        <StatTile
          icon={<CircleAlert />}
          label="Inactive"
          value={summary.inactive.toString()}
          tone={summary.inactive > 0 ? "warning" : "neutral"}
        />
        <StatTile
          icon={<CircleHelp />}
          label="Unknown"
          value={summary.unknown.toString()}
          tone={summary.unknown > 0 ? "warning" : "neutral"}
        />
        <StatTile
          icon={<Unplug />}
          label="Unavailable"
          value={summary.unavailable.toString()}
          tone={summary.unavailable > 0 ? "danger" : "neutral"}
        />
      </StatTileGrid>

      <div className="space-y-3">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            type="search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search stack, endpoint, provider, or type"
            aria-label="Search stacks"
            className="pl-8"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <ControlSelect
            label="Status"
            value={status}
            options={statusOptions}
            onChange={setStatus}
            className="min-w-[9rem]"
          />
          <ControlSelect
            label="Endpoint"
            value={endpoint}
            options={endpointOptions}
            onChange={setEndpoint}
            className="min-w-[12rem] flex-1 sm:max-w-sm"
          />
          {onRefresh ? (
            <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
              <RefreshCw aria-hidden className={cn(loading && "animate-spin")} />
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
          ) : null}
        </div>
        {filtersActive ? (
          <p role="status" className="text-xs text-muted-foreground">
            Showing {filtered.length} of {stacks.length} stacks.
          </p>
        ) : null}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((stack) => (
            <StackCard key={stack.id} stack={stack} onOpen={openStack} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No stacks match"
          description="Clear or adjust the search, status, and endpoint filters."
          actionLabel="Clear filters"
          onAction={() => {
            setSearch("");
            setStatus("all");
            setEndpoint("all");
          }}
        />
      )}

      <StackDetailSheet
        stack={selectedStack}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        originatingElement={originatingElement}
      />
    </div>
  );
}

function StackCard({
  stack,
  onOpen,
}: {
  stack: StackResource;
  onOpen: (stack: StackResource, element: HTMLElement) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`View containers for ${stack.name}`}
      onClick={(event) => onOpen(stack, event.currentTarget)}
      className="w-full rounded-xl border border-border/80 bg-card/80 p-4 text-left transition-colors outline-none hover:border-foreground/20 hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate font-medium">{stack.name}</span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">
            {stack.type} stack
          </span>
        </span>
        <StackStatusBadge status={stack.status} />
      </span>
      {stack.status === "unavailable" ? (
        <span className="mt-3 block text-xs text-muted-foreground">
          Endpoint disconnected. Last reported lifecycle: {stack.reportedStatus}.
        </span>
      ) : null}
      <span className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <StackDetail label="Endpoint" value={stack.endpointName} />
        <StackDetail label="Provider" value={stack.providerName} />
        {stack.createdAt ? (
          <StackDetail label="Created" value={new Date(stack.createdAt).toLocaleString()} />
        ) : null}
        {stack.updatedAt ? (
          <StackDetail label="Updated" value={new Date(stack.updatedAt).toLocaleString()} />
        ) : null}
      </span>
    </button>
  );
}

function StackDetail({ label, value }: { label: string; value: string }) {
  return (
    <span className="block min-w-0">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <span className="mt-0.5 block truncate">{value}</span>
    </span>
  );
}
