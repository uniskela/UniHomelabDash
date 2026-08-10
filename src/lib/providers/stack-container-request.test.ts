import assert from "node:assert/strict";
import test from "node:test";
import {
  StackContainerRequestController,
  lastReportedLifecycle,
  restoreStackDetailFocus,
  type StackContainerRequestState,
} from "./stack-container-request";
import type { StackResource } from "./types";

const connectedStack: StackResource = {
  id: "provider-1:42 / media",
  name: "media",
  status: "active",
  reportedStatus: "active",
  endpointStatus: "connected",
  type: "Compose",
  endpointId: 7,
  endpointName: "Docker host",
  providerId: "provider-1",
  providerName: "Primary Portainer",
};

function response(status: number, body: object = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function recorder() {
  const states: StackContainerRequestState[] = [];
  return { states, setState: (state: StackContainerRequestState) => states.push(state) };
}

test("stack container request does not fetch a disconnected endpoint", async () => {
  let calls = 0;
  const controller = new StackContainerRequestController(async () => {
    calls += 1;
    return response(200);
  });
  const result = recorder();

  await controller.load({ ...connectedStack, endpointStatus: "disconnected" }, false, result.setState);

  assert.equal(calls, 0);
  assert.deepEqual(result.states, [{ kind: "unavailable" }]);
});

test("stack container request maps API outcomes to distinct states", async () => {
  const cases: Array<{
    response: Response;
    expected: StackContainerRequestState;
  }> = [
    { response: response(401), expected: { kind: "unauthenticated" } },
    { response: response(404), expected: { kind: "not-found" } },
    { response: response(502), expected: { kind: "server-error" } },
    {
      response: response(200, { reason: "endpoint_disconnected", containers: [] }),
      expected: { kind: "unavailable" },
    },
    { response: response(200, { containers: [] }), expected: { kind: "empty" } },
    {
      response: response(200, {
        containers: [
          {
            id: "7:container-1",
            name: "jellyfin",
            state: "running",
            status: "Up 1 hour",
            image: "jellyfin:latest",
            ports: [],
            providerId: "provider-1",
            providerName: "Primary Portainer",
            endpointId: 7,
            endpointName: "Docker host",
          },
        ],
      }),
      expected: {
        kind: "ok",
        containers: [
          {
            id: "7:container-1",
            name: "jellyfin",
            state: "running",
            status: "Up 1 hour",
            image: "jellyfin:latest",
            ports: [],
            providerId: "provider-1",
            providerName: "Primary Portainer",
            endpointId: 7,
            endpointName: "Docker host",
          },
        ],
      },
    },
  ];

  for (const item of cases) {
    const controller = new StackContainerRequestController(async () => item.response);
    const result = recorder();

    await controller.load(connectedStack, false, result.setState);

    assert.deepEqual(result.states, [{ kind: "loading" }, item.expected]);
  }
});

test("stack container request maps network failures and retries with refresh", async () => {
  const requests: string[] = [];
  let attempt = 0;
  const controller = new StackContainerRequestController(async (input) => {
    requests.push(String(input));
    attempt += 1;
    if (attempt === 1) {
      throw new Error("offline");
    }
    return response(200, { containers: [] });
  });
  const result = recorder();

  await controller.load(connectedStack, false, result.setState);
  await controller.load(connectedStack, true, result.setState);

  assert.deepEqual(requests, [
    "/api/stacks/provider-1%3A42%20%2F%20media/containers",
    "/api/stacks/provider-1%3A42%20%2F%20media/containers?refresh=1",
  ]);
  assert.deepEqual(result.states, [
    { kind: "loading" },
    { kind: "network-error" },
    { kind: "loading" },
    { kind: "empty" },
  ]);
});

test("stack container request preserves the native fetch receiver", async () => {
  const originalFetch = globalThis.fetch;
  let receiverCorrect = false;
  globalThis.fetch = function (this: unknown) {
    receiverCorrect = this === globalThis;
    return Promise.resolve(response(200, { containers: [] }));
  } as typeof fetch;

  try {
    const controller = new StackContainerRequestController();
    const result = recorder();

    await controller.load(connectedStack, false, result.setState);

    assert.equal(receiverCorrect, true);
    assert.deepEqual(result.states, [{ kind: "loading" }, { kind: "empty" }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("stack container request suppresses stale responses after close aborts it", async () => {
  let resolveResponse: ((value: Response) => void) | undefined;
  let signal: AbortSignal | undefined;
  const controller = new StackContainerRequestController(
    async (_input, init) =>
      new Promise<Response>((resolve) => {
        signal = init?.signal ?? undefined;
        resolveResponse = resolve;
      })
  );
  const result = recorder();

  const request = controller.load(connectedStack, false, result.setState);
  controller.abort();
  resolveResponse?.(response(200, { containers: [] }));
  await request;

  assert.equal(signal?.aborted, true);
  assert.deepEqual(result.states, [{ kind: "loading" }]);
});

test("stack detail focus restoration prevents default and restores the trigger", () => {
  let prevented = false;
  let focused = false;

  restoreStackDetailFocus(
    { preventDefault: () => { prevented = true; } },
    { focus: () => { focused = true; } } as unknown as HTMLElement
  );

  assert.equal(prevented, true);
  assert.equal(focused, true);
});

test("last reported lifecycle preserves the status behind an unavailable effective state", () => {
  assert.equal(lastReportedLifecycle("active"), "Last reported lifecycle: active.");
});
