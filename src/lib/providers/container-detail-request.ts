import type {
  ContainerDetailResource,
  ContainerDetailResult,
  ContainerLogsResult,
  ContainerStatsResult,
  ContainerStatsSnapshot,
  ProviderResource,
} from "@/lib/providers/types";

export type ContainerInspectRequestState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; detail: ContainerDetailResource; cachedAt?: number }
  | { kind: "unavailable"; reason: string; message: string }
  | { kind: "not-found"; message: string }
  | { kind: "unauthenticated" }
  | { kind: "error"; message: string }
  | { kind: "network-error" };

export type ContainerStatsRequestState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; stats: ContainerStatsSnapshot; cachedAt?: number }
  | { kind: "unavailable"; reason: string; message: string }
  | { kind: "not-found"; message: string }
  | { kind: "unauthenticated" }
  | { kind: "error"; message: string }
  | { kind: "network-error" };

export type ContainerLogsRequestState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; logs: string }
  | { kind: "unauthenticated" }
  | { kind: "error"; message: string }
  | { kind: "network-error" };

export type ContainerLogsLoadOptions = {
  tail?: number;
  timestamps?: boolean;
};

type DetailFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type Channel = {
  controller: AbortController | null;
  version: number;
};

/**
 * Abort/version-gated loader for container inspect, stats, and logs.
 * Channels are independent so metrics polling is not cancelled by log reloads.
 * `abort()` cancels every in-flight request (drawer close / selection change).
 */
export class ContainerDetailRequestController {
  private inspect: Channel = { controller: null, version: 0 };
  private stats: Channel = { controller: null, version: 0 };
  private logs: Channel = { controller: null, version: 0 };

  constructor(
    private readonly fetcher: DetailFetch = (input, init) => globalThis.fetch(input, init)
  ) {}

  abort() {
    this.abortChannel(this.inspect);
    this.abortChannel(this.stats);
    this.abortChannel(this.logs);
  }

  async loadInspect(
    container: ProviderResource,
    refresh: boolean,
    setState: (state: ContainerInspectRequestState) => void
  ) {
    const providerId = container.providerId?.trim();
    if (!providerId) {
      setState({ kind: "error", message: "providerId is required." });
      return;
    }

    const { controller, version } = this.begin(this.inspect);
    setState({ kind: "loading" });

    try {
      const params = new URLSearchParams({ providerId });
      if (refresh) {
        params.set("refresh", "1");
      }
      const response = await this.fetcher(
        `/api/containers/${encodeURIComponent(container.id)}/inspect?${params.toString()}`,
        { cache: "no-store", signal: controller.signal }
      );
      const payload = (await response.json().catch(() => null)) as ContainerDetailResult | null;

      if (controller.signal.aborted || version !== this.inspect.version) {
        return;
      }

      setState(inspectStateForResponse(response, payload));
    } catch {
      if (!controller.signal.aborted && version === this.inspect.version) {
        setState({ kind: "network-error" });
      }
    }
  }

  async loadStats(
    container: ProviderResource,
    refresh: boolean,
    setState: (state: ContainerStatsRequestState) => void
  ) {
    const providerId = container.providerId?.trim();
    if (!providerId) {
      setState({ kind: "error", message: "providerId is required." });
      return;
    }

    const { controller, version } = this.begin(this.stats);
    setState({ kind: "loading" });

    try {
      const params = new URLSearchParams({ providerId });
      if (refresh) {
        params.set("refresh", "1");
      }
      const response = await this.fetcher(
        `/api/containers/${encodeURIComponent(container.id)}/stats?${params.toString()}`,
        { cache: "no-store", signal: controller.signal }
      );
      const payload = (await response.json().catch(() => null)) as ContainerStatsResult | null;

      if (controller.signal.aborted || version !== this.stats.version) {
        return;
      }

      setState(statsStateForResponse(response, payload));
    } catch {
      if (!controller.signal.aborted && version === this.stats.version) {
        setState({ kind: "network-error" });
      }
    }
  }

  async loadLogs(
    container: ProviderResource,
    options: ContainerLogsLoadOptions,
    setState: (state: ContainerLogsRequestState) => void
  ) {
    const { controller, version } = this.begin(this.logs);
    setState({ kind: "loading" });

    try {
      const params = new URLSearchParams({
        providerType: container.providerType,
        tail: String(options.tail ?? 200),
      });
      if (container.providerId) {
        params.set("providerId", container.providerId);
      }
      if (options.timestamps === false) {
        params.set("timestamps", "0");
      }
      const response = await this.fetcher(
        `/api/containers/${encodeURIComponent(container.id)}/logs?${params.toString()}`,
        { cache: "no-store", signal: controller.signal }
      );
      const payload = (await response.json().catch(() => null)) as
        | (Partial<ContainerLogsResult> & { error?: string })
        | null;

      if (controller.signal.aborted || version !== this.logs.version) {
        return;
      }

      setState(logsStateForResponse(response, payload));
    } catch {
      if (!controller.signal.aborted && version === this.logs.version) {
        setState({ kind: "network-error" });
      }
    }
  }

  private begin(channel: Channel) {
    this.abortChannel(channel);
    const controller = new AbortController();
    channel.controller = controller;
    return { controller, version: channel.version };
  }

  private abortChannel(channel: Channel) {
    channel.controller?.abort();
    channel.controller = null;
    channel.version += 1;
  }
}

function inspectStateForResponse(
  response: Response,
  payload: ContainerDetailResult | null
): ContainerInspectRequestState {
  if (response.status === 401) {
    return { kind: "unauthenticated" };
  }
  if (response.status === 404 || payload?.kind === "not_found") {
    return {
      kind: "not-found",
      message: payload && "message" in payload ? payload.message : "Container not found.",
    };
  }
  if (!payload) {
    return { kind: "network-error" };
  }
  if (payload.kind === "ok") {
    return { kind: "ok", detail: payload.detail, cachedAt: payload.cachedAt };
  }
  if (payload.kind === "unavailable") {
    return { kind: "unavailable", reason: payload.reason, message: payload.message };
  }
  if (payload.kind === "error") {
    return { kind: "error", message: payload.message };
  }
  if (!response.ok) {
    return { kind: "network-error" };
  }
  return { kind: "network-error" };
}

function statsStateForResponse(
  response: Response,
  payload: ContainerStatsResult | null
): ContainerStatsRequestState {
  if (response.status === 401) {
    return { kind: "unauthenticated" };
  }
  if (response.status === 404 || payload?.kind === "not_found") {
    return {
      kind: "not-found",
      message: payload && "message" in payload ? payload.message : "Container not found.",
    };
  }
  if (!payload) {
    return { kind: "network-error" };
  }
  if (payload.kind === "ok") {
    return { kind: "ok", stats: payload.stats, cachedAt: payload.cachedAt };
  }
  if (payload.kind === "unavailable") {
    return { kind: "unavailable", reason: payload.reason, message: payload.message };
  }
  if (payload.kind === "error") {
    return { kind: "error", message: payload.message };
  }
  if (!response.ok) {
    return { kind: "network-error" };
  }
  return { kind: "network-error" };
}

function logsStateForResponse(
  response: Response,
  payload: (Partial<ContainerLogsResult> & { error?: string }) | null
): ContainerLogsRequestState {
  if (response.status === 401) {
    return { kind: "unauthenticated" };
  }
  if (!response.ok) {
    return {
      kind: "error",
      message: payload?.error ?? payload?.message ?? "Failed to load container logs.",
    };
  }
  return { kind: "ok", logs: payload?.logs ?? "" };
}

export function containerInspectAnnouncement(state: ContainerInspectRequestState) {
  switch (state.kind) {
    case "idle":
      return "";
    case "loading":
      return "Loading container details.";
    case "ok":
      return "Container details loaded.";
    case "unavailable":
      return state.message;
    case "not-found":
      return state.message;
    case "unauthenticated":
      return "Your session expired. Sign in again to view container details.";
    case "error":
      return state.message;
    case "network-error":
      return "Could not load container details.";
  }
}
