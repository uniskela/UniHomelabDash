"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers3, LoaderCircle } from "lucide-react";
import { StackList } from "@/components/stack-list";
import type { StackResource } from "@/lib/providers/types";

type StacksPayload = {
  stacks?: StackResource[];
  error?: string | null;
  warning?: string | null;
};

export function AsyncStackList({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return <StackList stacks={[]} enabled={false} />;
  }

  return <EnabledStackList />;
}

function EnabledStackList() {
  const [stacks, setStacks] = useState<StackResource[]>([]);
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
        const url = refreshToken === 0 ? "/api/stacks" : "/api/stacks?refresh=1";
        const response = await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as StacksPayload | null;
        if (!active) {
          return;
        }

        if (!response.ok) {
          setStacks([]);
          setError(payload?.error ?? "Failed to load stacks.");
          setWarning(null);
          return;
        }

        setStacks(payload?.stacks ?? []);
        setError(payload?.error ?? null);
        setWarning(payload?.warning ?? null);
      } catch (loadError) {
        if (!active || controller.signal.aborted) {
          return;
        }
        setStacks([]);
        setError(loadError instanceof Error ? loadError.message : "Failed to load stacks.");
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

  if (loading && stacks.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin text-rose-300" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">Loading stacks…</p>
          <p>Fetching read-only lifecycle status from your Portainer integrations.</p>
        </div>
        <Layers3 className="ml-auto size-4 opacity-40" />
      </div>
    );
  }

  return (
    <StackList
      stacks={stacks}
      error={error}
      warning={warning}
      enabled
      loading={loading}
      onRefresh={refresh}
    />
  );
}
