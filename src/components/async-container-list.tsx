"use client";

import { useCallback, useEffect, useState } from "react";
import { ContainerList } from "@/components/container-list";
import {
  defaultContainerViewPreferences,
  type ContainerViewPreferences,
} from "@/lib/providers/container-preferences";
import type { ProviderResource } from "@/lib/providers/types";

type ContainersPayload = {
  containers?: ProviderResource[];
  error?: string | null;
  warning?: string | null;
  cachedAt?: number | null;
};

export function AsyncContainerList({
  enabled,
  actionsEnabled = false,
  initialPreferences = defaultContainerViewPreferences,
  initialSearchQuery = "",
}: {
  enabled: boolean;
  actionsEnabled?: boolean;
  initialPreferences?: ContainerViewPreferences;
  initialSearchQuery?: string;
}) {
  if (!enabled) {
    return (
      <ContainerList
        containers={[]}
        enabled={false}
        actionsEnabled={actionsEnabled}
        initialSearchQuery={initialSearchQuery}
      />
    );
  }

  return (
    <EnabledContainerList
      actionsEnabled={actionsEnabled}
      initialPreferences={initialPreferences}
      initialSearchQuery={initialSearchQuery}
    />
  );
}

function EnabledContainerList({
  actionsEnabled,
  initialPreferences,
  initialSearchQuery,
}: {
  actionsEnabled: boolean;
  initialPreferences: ContainerViewPreferences;
  initialSearchQuery: string;
}) {
  const [containers, setContainers] = useState<ProviderResource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const url = refreshToken === 0 ? "/api/containers" : "/api/containers?refresh=1";
        const response = await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as ContainersPayload | null;

        if (!active) {
          return;
        }

        if (!response.ok) {
          setContainers([]);
          setError(payload?.error ?? "Failed to load containers.");
          setWarning(null);
          return;
        }

        setContainers(payload?.containers ?? []);
        setError(payload?.error ?? null);
        setWarning(payload?.warning ?? null);
      } catch (loadError) {
        if (!active || controller.signal.aborted) {
          return;
        }
        setContainers([]);
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load containers."
        );
        setWarning(null);
      } finally {
        if (active) {
          setLoading(false);
          setLoadedOnce(true);
        }
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [refreshToken]);

  if (!loadedOnce) {
    return <ContainerListSkeleton />;
  }

  return (
    <ContainerList
      containers={containers}
      error={error}
      warning={warning}
      enabled
      actionsEnabled={actionsEnabled}
      initialPreferences={initialPreferences}
      initialSearchQuery={initialSearchQuery}
      onRefresh={refresh}
      refreshing={loading}
    />
  );
}

function ContainerListSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <p role="status" className="text-sm text-muted-foreground">
        Loading containers from Docker and Portainer…
      </p>
      <div aria-hidden className="space-y-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-muted/50 sm:h-24" />
          ))}
        </div>
        <div className="h-8 animate-pulse rounded-lg bg-muted/50 pointer-coarse:h-10" />
        <div className="grid gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
