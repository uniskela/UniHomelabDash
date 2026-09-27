"use client";

import { useId, useMemo, useState } from "react";
import { RefreshCw, Search, Settings2, SlidersHorizontal } from "lucide-react";
import { ControlSelect } from "@/components/control-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { containerQueryPrefixes } from "@/lib/providers/container-query";
import {
  containerVisibleFields,
  maxSearchLength,
  type ContainerDensity,
  type ContainerGroupMode,
  type ContainerSavedView,
  type ContainerSortDirection,
  type ContainerSortField,
  type ContainerStatusFilter,
  type ContainerViewMode,
  type ContainerVisibleField,
} from "@/lib/providers/container-preferences";
import { cn } from "@/lib/utils";

const statusOptions: Array<{ value: ContainerStatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "running", label: "Running" },
  { value: "stopped", label: "Stopped" },
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

const sortFieldOptions: Array<{ value: ContainerSortField; label: string }> = [
  { value: "name", label: "Name" },
  { value: "state", label: "State" },
  { value: "host", label: "Host" },
  { value: "provider", label: "Provider" },
  { value: "image", label: "Image" },
  { value: "createdAt", label: "Created" },
];

const sortDirectionOptions: Array<{ value: ContainerSortDirection; label: string }> = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

const densityOptions: Array<{ value: ContainerDensity; label: string }> = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

const fieldLabels: Record<ContainerVisibleField, string> = {
  image: "Image",
  host: "Host",
  provider: "Provider",
  ports: "Ports",
  statusText: "Status text",
  createdAt: "Created",
};

type SelectOption = { value: string; label: string };

export function ContainerInventoryToolbar({
  draft,
  onDraftChange,
  hostOptions,
  providerOptions,
  resultSummary,
  filtersActive = false,
  onClearFilters,
  onRefresh,
  refreshing = false,
}: {
  draft: ContainerSavedView;
  onDraftChange: (next: ContainerSavedView) => void;
  hostOptions: string[];
  providerOptions: string[];
  resultSummary?: string | null;
  filtersActive?: boolean;
  onClearFilters?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const [showSearchTips, setShowSearchTips] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const displayPanelId = useId();
  const searchTipsId = useId();

  const hostSelectOptions = useMemo(
    () => [
      { value: "", label: "All hosts" },
      ...hostOptions.map((host) => ({ value: host, label: host })),
    ],
    [hostOptions]
  );

  const providerSelectOptions = useMemo(
    () => [
      { value: "", label: "All providers" },
      ...providerOptions.map((provider) => ({ value: provider, label: provider })),
    ],
    [providerOptions]
  );

  function patch(partial: Partial<ContainerSavedView>) {
    onDraftChange({ ...draft, ...partial });
  }

  function toggleField(field: ContainerVisibleField) {
    const next = draft.visibleFields.includes(field)
      ? draft.visibleFields.filter((item) => item !== field)
      : [...draft.visibleFields, field];
    patch({ visibleFields: next });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={draft.search}
            maxLength={maxSearchLength}
            onChange={(event) => patch({ search: event.target.value })}
            placeholder="Search name, image, host, or port"
            aria-label="Search containers"
            className="pl-8"
          />
        </div>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="shrink-0 sm:hidden"
          onClick={() => setFiltersOpen(true)}
          aria-label={filtersActive ? "Filters and display (filters active)" : "Filters and display"}
        >
          <SlidersHorizontal />
        </Button>
        {onRefresh ? (
          <>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="shrink-0 sm:hidden"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label={refreshing ? "Refreshing containers" : "Refresh containers"}
            >
              <RefreshCw className={cn(refreshing && "animate-spin")} />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="hidden shrink-0 sm:inline-flex"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw aria-hidden className={cn(refreshing && "animate-spin")} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
          </>
        ) : null}
      </div>

      <div>
        <Button
          type="button"
          size="xs"
          variant="link"
          className="h-auto px-0 text-xs text-muted-foreground hover:text-foreground pointer-coarse:px-0"
          onClick={() => setShowSearchTips((current) => !current)}
          aria-expanded={showSearchTips}
          aria-controls={searchTipsId}
        >
          {showSearchTips ? "Hide search tips" : "Search tips: host:, name:, image:…"}
        </Button>
      </div>
      {showSearchTips ? <SearchTips id={searchTipsId} /> : null}

      <div className="hidden space-y-3 sm:block">
        <div className="flex flex-wrap items-end gap-3">
          <FilterControls
            draft={draft}
            hostSelectOptions={hostSelectOptions}
            providerSelectOptions={providerSelectOptions}
            onPatch={patch}
          />
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setDisplayOpen((current) => !current)}
            aria-expanded={displayOpen}
            aria-controls={displayPanelId}
          >
            <Settings2 aria-hidden />
            {displayOpen ? "Hide display options" : "Display options"}
          </Button>
        </div>
        {displayOpen ? (
          <div
            id={displayPanelId}
            className="rounded-lg border border-border/70 bg-muted/10 p-3"
          >
            <DisplayControls draft={draft} onPatch={patch} onToggleField={toggleField} />
          </div>
        ) : null}
      </div>

      {resultSummary || filtersActive ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {resultSummary ? <p>{resultSummary}</p> : null}
          {filtersActive && onClearFilters ? (
            <Button
              type="button"
              size="xs"
              variant="link"
              className="h-auto px-0 text-xs pointer-coarse:px-0"
              onClick={onClearFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : null}

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Filters and display</SheetTitle>
            <SheetDescription>Narrow the list and choose how containers are shown.</SheetDescription>
          </SheetHeader>
          <div className="space-y-6 px-4 pb-6">
            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-medium">Filter</legend>
              <div className="grid gap-3">
                <FilterControls
                  draft={draft}
                  hostSelectOptions={hostSelectOptions}
                  providerSelectOptions={providerSelectOptions}
                  onPatch={patch}
                />
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-medium">Display</legend>
              <DisplayControls draft={draft} onPatch={patch} onToggleField={toggleField} />
            </fieldset>
            <Button type="button" className="w-full" onClick={() => setFiltersOpen(false)}>
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterControls({
  draft,
  hostSelectOptions,
  providerSelectOptions,
  onPatch,
}: {
  draft: ContainerSavedView;
  hostSelectOptions: SelectOption[];
  providerSelectOptions: SelectOption[];
  onPatch: (partial: Partial<ContainerSavedView>) => void;
}) {
  return (
    <>
      <ControlSelect
        label="Status"
        value={draft.status}
        options={statusOptions}
        onChange={(status) => onPatch({ status })}
        className="sm:w-40"
      />
      <ControlSelect
        label="Host"
        value={draft.host}
        options={hostSelectOptions}
        onChange={(host) => onPatch({ host })}
        className="sm:w-48"
      />
      <ControlSelect
        label="Provider"
        value={draft.provider}
        options={providerSelectOptions}
        onChange={(provider) => onPatch({ provider })}
        className="sm:w-48"
      />
    </>
  );
}

function DisplayControls({
  draft,
  onPatch,
  onToggleField,
}: {
  draft: ContainerSavedView;
  onPatch: (partial: Partial<ContainerSavedView>) => void;
  onToggleField: (field: ContainerVisibleField) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <ControlSelect
          label="Sort by"
          value={draft.sortField}
          options={sortFieldOptions}
          onChange={(sortField) => onPatch({ sortField })}
        />
        <ControlSelect
          label="Direction"
          value={draft.sortDirection}
          options={sortDirectionOptions}
          onChange={(sortDirection) => onPatch({ sortDirection })}
        />
        <ControlSelect
          label="View as"
          value={draft.view}
          options={viewOptions}
          onChange={(view) => onPatch({ view })}
        />
        <ControlSelect
          label="Grouped by"
          value={draft.groupBy}
          options={groupOptions}
          onChange={(groupBy) => onPatch({ groupBy })}
        />
        <ControlSelect
          label="Density"
          value={draft.density}
          options={densityOptions}
          onChange={(density) => onPatch({ density })}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-foreground">Show on cards</legend>
        <div className="flex flex-wrap gap-2">
          {containerVisibleFields.map((field) => {
            const active = draft.visibleFields.includes(field);
            return (
              <Button
                key={field}
                type="button"
                size="sm"
                variant={active ? "secondary" : "outline"}
                onClick={() => onToggleField(field)}
                aria-pressed={active}
                className={cn(!active && "text-muted-foreground")}
              >
                {fieldLabels[field]}
              </Button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

function SearchTips({ id }: { id: string }) {
  return (
    <div
      id={id}
      className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground"
    >
      <p>
        Plain text searches names, images, hosts, and ports. Add a prefix to target one field,
        and combine as many terms as you like.
      </p>
      <div className="flex flex-wrap gap-1">
        {containerQueryPrefixes.map((prefix) => (
          <code
            key={prefix}
            className="rounded-md bg-background px-1.5 py-0.5 font-mono text-[0.7rem] text-foreground"
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
