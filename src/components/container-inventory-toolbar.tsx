"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
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

export function ContainerInventoryToolbar({
  draft,
  onDraftChange,
  hostOptions,
  providerOptions,
  resultSummary,
}: {
  draft: ContainerSavedView;
  onDraftChange: (next: ContainerSavedView) => void;
  hostOptions: string[];
  providerOptions: string[];
  resultSummary?: string | null;
}) {
  const [showSearchTips, setShowSearchTips] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const filters = (
    <PresentationControls
      draft={draft}
      hostSelectOptions={hostSelectOptions}
      providerSelectOptions={providerSelectOptions}
      onPatch={patch}
      onToggleField={toggleField}
      includeStatus
    />
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={draft.search}
              maxLength={maxSearchLength}
              onChange={(event) => patch({ search: event.target.value })}
              placeholder="Search containers, or try host:nas name:immich"
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
            aria-label="Open filters"
          >
            <SlidersHorizontal />
          </Button>
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

      <div className="hidden sm:block">{filters}</div>

      {resultSummary ? (
        <p className="text-xs text-muted-foreground">{resultSummary}</p>
      ) : null}

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Filters & presentation</SheetTitle>
            <SheetDescription>
              Narrow the inventory and choose how container cards are shown.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">{filters}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PresentationControls({
  draft,
  hostSelectOptions,
  providerSelectOptions,
  onPatch,
  onToggleField,
  includeStatus,
}: {
  draft: ContainerSavedView;
  hostSelectOptions: Array<{ value: string; label: string }>;
  providerSelectOptions: Array<{ value: string; label: string }>;
  onPatch: (partial: Partial<ContainerSavedView>) => void;
  onToggleField: (field: ContainerVisibleField) => void;
  includeStatus?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {includeStatus ? (
          <ControlSelect
            label="Status"
            value={draft.status}
            options={statusOptions}
            onChange={(status) => onPatch({ status })}
            className="min-w-[9rem]"
          />
        ) : null}
        <ControlSelect
          label="Host"
          value={draft.host}
          options={hostSelectOptions}
          onChange={(host) => onPatch({ host })}
          className="min-w-[10rem] flex-1 sm:max-w-xs"
        />
        <ControlSelect
          label="Provider"
          value={draft.provider}
          options={providerSelectOptions}
          onChange={(provider) => onPatch({ provider })}
          className="min-w-[10rem] flex-1 sm:max-w-xs"
        />
        <ControlSelect
          label="Sort by"
          value={draft.sortField}
          options={sortFieldOptions}
          onChange={(sortField) => onPatch({ sortField })}
          className="min-w-[8rem]"
        />
        <ControlSelect
          label="Direction"
          value={draft.sortDirection}
          options={sortDirectionOptions}
          onChange={(sortDirection) => onPatch({ sortDirection })}
          className="min-w-[8rem]"
        />
        <ControlSelect
          label="View as"
          value={draft.view}
          options={viewOptions}
          onChange={(view) => onPatch({ view })}
          className="min-w-[7rem]"
        />
        <ControlSelect
          label="Grouped by"
          value={draft.groupBy}
          options={groupOptions}
          onChange={(groupBy) => onPatch({ groupBy })}
          className="min-w-[9rem]"
        />
        <ControlSelect
          label="Density"
          value={draft.density}
          options={densityOptions}
          onChange={(density) => onPatch({ density })}
          className="min-w-[8rem]"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-foreground">Visible fields</legend>
        <div className="flex flex-wrap gap-2">
          {containerVisibleFields.map((field) => {
            const active = draft.visibleFields.includes(field);
            return (
              <Button
                key={field}
                type="button"
                size="xs"
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
