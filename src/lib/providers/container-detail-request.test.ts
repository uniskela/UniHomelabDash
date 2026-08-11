import assert from "node:assert/strict";
import test from "node:test";
import {
  ContainerDetailRequestController,
  type ContainerInspectRequestState,
  type ContainerStatsRequestState,
} from "./container-detail-request";
import type { ProviderResource } from "./types";

const sampleContainer = (id: string, name: string): ProviderResource => ({
  id,
  kind: "container",
  name,
  status: "running",
  providerType: "docker",
  providerId: "p1",
});

test("ContainerDetailRequestController ignores late inspect responses after abort", async () => {
  const states: ContainerInspectRequestState["kind"][] = [];
  let resolveFetch!: (value: Response) => void;
  const fetchPromise = new Promise<Response>((resolve) => {
    resolveFetch = resolve;
  });

  const controller = new ContainerDetailRequestController(async () => fetchPromise);

  const loadPromise = controller.loadInspect(sampleContainer("c1", "web"), false, (state) => {
    states.push(state.kind);
  });

  controller.abort();
  resolveFetch(
    new Response(JSON.stringify({ kind: "ok", detail: { id: "c1", name: "web" } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  );

  await loadPromise;
  assert.ok(!states.includes("ok"));
});

test("ContainerDetailRequestController suppresses stale stats after selection change", async () => {
  const states: string[] = [];
  const responses = [
    new Response(
      JSON.stringify({
        kind: "ok",
        stats: {
          sampledAt: new Date().toISOString(),
          cpuPercent: 1,
          memoryUsageBytes: 1,
          memoryLimitBytes: 2,
          memoryPercent: 50,
          networkRxBytes: null,
          networkTxBytes: null,
          blockReadBytes: null,
          blockWriteBytes: null,
          pids: 1,
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    ),
    new Response(
      JSON.stringify({
        kind: "ok",
        stats: {
          sampledAt: new Date().toISOString(),
          cpuPercent: 9,
          memoryUsageBytes: 1,
          memoryLimitBytes: 2,
          memoryPercent: 50,
          networkRxBytes: null,
          networkTxBytes: null,
          blockReadBytes: null,
          blockWriteBytes: null,
          pids: 1,
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    ),
  ];

  let call = 0;
  const controller = new ContainerDetailRequestController(async () => {
    const index = call;
    call += 1;
    const response = responses[index] ?? responses[responses.length - 1]!;
    await new Promise((resolve) => setTimeout(resolve, index === 0 ? 30 : 0));
    return response;
  });

  const firstLoad = controller.loadStats(sampleContainer("c1", "web"), false, (state) => {
    if (state.kind === "ok") {
      states.push(`c1:${state.stats.cpuPercent}`);
    }
  });
  const secondLoad = controller.loadStats(sampleContainer("c2", "db"), false, (state) => {
    if (state.kind === "ok") {
      states.push(`c2:${state.stats.cpuPercent}`);
    }
  });

  await Promise.all([firstLoad, secondLoad]);
  assert.deepEqual(states, ["c2:9"]);
});

test("ContainerDetailRequestController reports missing providerId", async () => {
  const states: ContainerStatsRequestState["kind"][] = [];
  const controller = new ContainerDetailRequestController(async () => {
    throw new Error("should not fetch");
  });

  await controller.loadStats(
    {
      id: "c1",
      kind: "container",
      name: "web",
      status: "running",
      providerType: "docker",
    },
    false,
    (state) => states.push(state.kind)
  );

  assert.deepEqual(states, ["error"]);
});
