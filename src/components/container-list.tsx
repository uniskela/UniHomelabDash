"use client";

import { Box, CircleCheck, CircleStop, Eye, Search, Settings } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ContainerCard } from "@/components/container-card";
import { ContainerControlDrawer } from "@/components/container-control-drawer";
import { ContainerInventoryToolbar } from "@/components/container-inventory-toolbar";
import { ContainerSavedViewManager } from "@/components/container-saved-view-manager";
import { EmptyState } from "@/components/empty-state";
import { InlineNotice } from "@/components/inline-notice";
import { StatTile, StatTileGrid } from "@/components/stat-tile";
import { useContainerViewPreferences } from "@/components/use-container-view-preferences";
import { Button } from "@/components/ui/button";
import {
  containerHideKey,
  filterContainers,
  groupContainers,
  isRunningContainer,
  listContainerHostOptions,
  listContainerProviderOptions,
  sortContainers,
  splitHiddenContainers,
} from "@/lib/providers/container-filters";
import {
  defaultContainerWorkspacePreferences,
  resolveActiveView,
  toggleHiddenContainer,
  viewsAreEqual,
  type ContainerSavedView,
  type ContainerViewMode,
  type ContainerWorkspacePreferences,
} from "@/lib/providers/container-preferences";
import type { ProviderResource } from "@/lib/providers/types";

const viewClasses: Record<ContainerViewMode, string> = {
  list: "grid gap-3",
  grid: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
  tiles: "grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4",
};

export function ContainerList({
  containers,
  error,
  warning,
  enabled,
  actionsEnabled = false,
  initialPreferences = defaultContainerWorkspacePreferences,
  initialSearchQuery = "",
  onRefresh,
  refreshing = false,
}: {
  containers: ProviderResource[];
  error?: string | null;
  warning?: string | null;
  enabled: boolean;
  actionsEnabled?: boolean;
  initialPreferences?: ContainerWorkspacePreferences;
  initialSearchQuery?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const { preferences, saveError, update } = useContainerViewPreferences(initialPreferences);
  const [draft, setDraft] = useState<ContainerSavedView>(() =>
    withInitialSearch(resolveActiveView(initialPreferences), initialSearchQuery)
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState<string | null>(null);
  const skipNextViewSync = useRef(true);

  useEffect(() => {
    if (skipNextViewSync.current) {
      skipNextViewSync.current = false;
      return;
    }
    setDraft(resolveActiveView(preferences));
    // Sync draft when the active saved view identity or stored user views change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on view identity, not every preference field
  }, [preferences.activeViewId, preferences.views]);

  const selected = useMemo(() => {
    if (!selectedKey) {
      return null;
    }
    return (
      containers.find((container) => containerSelectionKey(container) === selectedKey) ?? null
    );
  }, [containers, selectedKey]);

  const modified = !viewsAreEqual(draft, resolveActiveView(preferences));

  const hostOptions = useMemo(() => listContainerHostOptions(containers), [containers]);
  const providerOptions = useMemo(
    () => listContainerProviderOptions(containers),
    [containers]
  );

  const { visible, concealed } = useMemo(
    () => splitHiddenContainers(containers, preferences.hidden),
    [containers, preferences.hidden]
  );

  const scopedContainers = showHidden ? containers : visible;

  const filteredContainers = useMemo(() => {
    const filtered = filterContainers(scopedContainers, {
      status: draft.status,
      host: draft.host,
      provider: draft.provider,
      search: draft.search,
    });
    return sortContainers(filtered, draft.sortField, draft.sortDirection);
  }, [scopedContainers, draft]);

  const groups = useMemo(
    () => groupContainers(filteredContainers, draft.groupBy),
    [filteredContainers, draft.groupBy]
  );

  const hiddenKeys = useMemo(() => new Set(preferences.hidden), [preferences.hidden]);

  function selectView(viewId: string) {
    update({ ...preferences, activeViewId: viewId });
  }

  function toggleHidden(container: ProviderResource) {
    update({
      ...preferences,
      hidden: toggleHiddenContainer(preferences.hidden, containerHideKey(container)),
    });
  }

  function clearFilters() {
    setDraft((current) => ({ ...current, search: "", status: "all", host: "", provider: "" }));
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
        actionLabel="Set up an integration"
        actionHref="/settings#integrations"
      />
    );
  }

  if (error && containers.length === 0) {
    return (
      <EmptyState
        icon={Settings}
        title="Cannot reach containers"
        description={`${error} Check your Docker or Portainer integration settings and try again.`}
        actionLabel="Review integrations"
        actionHref="/settings#integrations"
      />
    );
  }

  if (containers.length === 0) {
    return (
      <EmptyState
        icon={Box}
        title="No containers found"
        description="Your integrations responded, but they did not report any containers."
        actionLabel={onRefresh ? "Refresh" : undefined}
        onAction={onRefresh}
      />
    );
  }

  const runningCount = visible.filter((item) => isRunningContainer(item.status)).length;
  const stoppedCount = visible.length - runningCount;
  const filtersActive =
    draft.status !== "all" ||
    draft.host.trim().length > 0 ||
    draft.provider.trim().length > 0 ||
    draft.search.trim().length > 0;

  const resultSummary =
    filtersActive || showHidden
      ? `Showing ${filteredContainers.length} of ${scopedContainers.length} containers${draft.host ? ` on ${draft.host}` : ""}.`
      : null;

  return (
    <>
      {warning && dismissedWarning !== warning ? (
        <InlineNotice
          onDismiss={() => setDismissedWarning(warning)}
          dismissLabel="Dismiss container warning"
        >
          Some integrations failed while loading containers. Healthy results are still shown.{" "}
          {warning}
        </InlineNotice>
      ) : null}

      <StatTileGrid label="Container summary">
        <StatTile
          icon={<Box />}
          label="Total"
          value={visible.length.toString()}
          detail={concealed.length > 0 ? `${concealed.length} hidden` : undefined}
        />
        <StatTile
          icon={<CircleCheck />}
          label="Running"
          value={runningCount.toString()}
          tone={runningCount > 0 ? "success" : "neutral"}
        />
        <StatTile
          icon={<CircleStop />}
          label="Stopped"
          value={stoppedCount.toString()}
          tone={stoppedCount > 0 ? "warning" : "neutral"}
        />
      </StatTileGrid>

      <div className="space-y-3">
        <ContainerSavedViewManager
          workspace={preferences}
          draft={draft}
          modified={modified}
          onSelectView={selectView}
          onSaveWorkspace={update}
        />

        <ContainerInventoryToolbar
          draft={draft}
          onDraftChange={setDraft}
          hostOptions={hostOptions}
          providerOptions={providerOptions}
          resultSummary={resultSummary}
          filtersActive={filtersActive}
          onClearFilters={clearFilters}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground empty:hidden">
          {concealed.length > 0 ? (
            <>
              <span>
                {concealed.length} {concealed.length === 1 ? "container" : "containers"} hidden.
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowHidden((current) => !current)}
                aria-pressed={showHidden}
              >
                <Eye aria-hidden />
                {showHidden ? "Hide hidden" : "Show hidden"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={unhideAll}>
                Unhide all
              </Button>
            </>
          ) : null}
          {saveError ? (
            <span className="text-warning" role="status">
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
            <div className={viewClasses[draft.view]}>
              {group.containers.map((container) => (
                <ContainerCard
                  key={`${container.providerId ?? container.providerType}-${container.id}`}
                  container={container}
                  view={draft.view}
                  density={draft.density}
                  visibleFields={draft.visibleFields}
                  hidden={hiddenKeys.has(containerHideKey(container))}
                  onOpen={() => setSelectedKey(containerSelectionKey(container))}
                  onToggleHidden={() => toggleHidden(container)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {filteredContainers.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No containers match"
          description={
            concealed.length > 0 && !showHidden
              ? "Adjust the search or filters. Some containers are also hidden."
              : "Adjust the search or filters to see more containers."
          }
          actionLabel={filtersActive ? "Clear filters" : undefined}
          onAction={filtersActive ? clearFilters : undefined}
        />
      ) : null}

      <ContainerControlDrawer
        container={selected}
        open={Boolean(selectedKey)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedKey(null);
          }
        }}
        actionsEnabled={actionsEnabled}
        onActionSuccess={onRefresh}
      />
    </>
  );
}

function containerSelectionKey(container: ProviderResource) {
  return `${container.providerId ?? container.providerType}::${container.id}`;
}

function withInitialSearch(view: ContainerSavedView, initialSearchQuery: string) {
  if (!initialSearchQuery.trim()) {
    return view;
  }
  return { ...view, search: initialSearchQuery };
}
