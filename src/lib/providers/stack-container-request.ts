import type { StackContainerResource, StackResource } from "@/lib/providers/types";

type StackContainersPayload = {
  containers?: StackContainerResource[];
  reason?: string | null;
};

export type StackContainerRequestState =
  | { kind: "idle" | "loading" }
  | { kind: "ok"; containers: StackContainerResource[] }
  | { kind: "empty" }
  | { kind: "unavailable" }
  | { kind: "unauthenticated" }
  | { kind: "not-found" }
  | { kind: "server-error" }
  | { kind: "network-error" };

type StackContainerFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class StackContainerRequestController {
  private controller: AbortController | null = null;
  private version = 0;

  constructor(
    private readonly fetcher: StackContainerFetch = (input, init) =>
      globalThis.fetch(input, init)
  ) {}

  abort() {
    this.controller?.abort();
    this.controller = null;
    this.version += 1;
  }

  async load(
    stack: StackResource,
    refresh: boolean,
    setState: (state: StackContainerRequestState) => void
  ) {
    this.abort();

    if (stack.endpointStatus === "disconnected") {
      setState({ kind: "unavailable" });
      return;
    }

    const controller = new AbortController();
    this.controller = controller;
    const version = this.version;
    setState({ kind: "loading" });

    try {
      const response = await this.fetcher(
        `/api/stacks/${encodeURIComponent(stack.id)}/containers${refresh ? "?refresh=1" : ""}`,
        { cache: "no-store", signal: controller.signal }
      );
      const payload = (await response.json().catch(() => null)) as StackContainersPayload | null;

      if (controller.signal.aborted || version !== this.version) {
        return;
      }

      setState(stateForResponse(response, payload));
    } catch {
      if (!controller.signal.aborted && version === this.version) {
        setState({ kind: "network-error" });
      }
    }
  }
}

function stateForResponse(
  response: Response,
  payload: StackContainersPayload | null
): StackContainerRequestState {
  if (response.status === 401) {
    return { kind: "unauthenticated" } as const;
  }
  if (response.status === 404) {
    return { kind: "not-found" } as const;
  }
  if (response.status === 502) {
    return { kind: "server-error" } as const;
  }
  if (!response.ok) {
    return { kind: "network-error" } as const;
  }
  if (payload?.reason === "endpoint_disconnected") {
    return { kind: "unavailable" } as const;
  }

  const containers = payload?.containers ?? [];
  return containers.length > 0 ? { kind: "ok", containers } : { kind: "empty" };
}

export function lastReportedLifecycle(status: StackResource["reportedStatus"]) {
  return `Last reported lifecycle: ${status}.`;
}

export function restoreStackDetailFocus(
  event: { preventDefault: () => void },
  originatingElement: Pick<HTMLElement, "focus"> | null
) {
  event.preventDefault();
  originatingElement?.focus();
}
