"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, LoaderCircle } from "lucide-react";
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
}: {
  enabled: boolean;
  actionsEnabled?: boolean;
  initialPreferences?: ContainerViewPreferences;
}) {
  if (!enabled) {
    return <ContainerList containers={[]} enabled={false} actionsEnabled={actionsEnabled} />;
  }

  return (
    <EnabledContainerList actionsEnabled={actionsEnabled} initialPreferences={initialPreferences} />
  );
}

function EnabledContainerList({
  actionsEnabled,
  initialPreferences,
}: {
  actionsEnabled: boolean;
  initialPreferences: ContainerViewPreferences;
}) {
  const [containers, setContainers] = useState<ProviderResource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
        const response = await fetch("/api/containers", {
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
        }
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [refreshToken]);

  if (loading && containers.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin text-rose-300" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">Loading containers…</p>
          <p>
            Fetching Docker and Portainer status. Healthy endpoints appear as soon as they respond.
          </p>
        </div>
        <Box className="ml-auto size-4 opacity-40" />
      </div>
    );
  }

  return (
    <ContainerList
      containers={containers}
      error={error}
      warning={warning}
      enabled
      actionsEnabled={actionsEnabled}
      initialPreferences={initialPreferences}
      onRefresh={refresh}
    />
  );
}
