import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContainerActionActivity,
  buildHealthTransitionActivity,
  buildProviderConnectionActivity,
  shouldRecordHealthTransition,
} from "./types";

test("shouldRecordHealthTransition detects degraded and recovery", () => {
  assert.equal(shouldRecordHealthTransition("healthy", "healthy"), false);
  assert.equal(shouldRecordHealthTransition("healthy", "degraded"), true);
  assert.equal(shouldRecordHealthTransition("unknown", "degraded"), true);
  assert.equal(shouldRecordHealthTransition("degraded", "healthy"), true);
  assert.equal(shouldRecordHealthTransition("unknown", "healthy"), false);
});

test("buildHealthTransitionActivity creates degraded alert activity", () => {
  const activity = buildHealthTransitionActivity({
    serviceId: "svc-1",
    serviceName: "Jellyfin",
    previousStatus: "healthy",
    nextStatus: "degraded",
    errorMessage: "HTTP 503",
  });

  assert.ok(activity);
  assert.equal(activity?.type, "service.health.degraded");
  assert.equal(activity?.severity, "warning");
  assert.equal(activity?.alertDedupeKey, "service:svc-1:health");
  assert.match(activity?.detail ?? "", /503/);
});

test("buildHealthTransitionActivity resolves alert on recovery", () => {
  const activity = buildHealthTransitionActivity({
    serviceId: "svc-1",
    serviceName: "Jellyfin",
    previousStatus: "degraded",
    nextStatus: "healthy",
  });

  assert.ok(activity);
  assert.equal(activity?.type, "service.health.recovered");
  assert.equal(activity?.resolveAlert, true);
});

test("buildProviderConnectionActivity records failures and recoveries", () => {
  const failure = buildProviderConnectionActivity({
    providerId: "p1",
    providerName: "Docker",
    providerType: "docker",
    ok: false,
    message: "Connection refused",
    hadPreviousError: false,
  });

  assert.ok(failure);
  assert.equal(failure?.severity, "error");

  const recovery = buildProviderConnectionActivity({
    providerId: "p1",
    providerName: "Docker",
    providerType: "docker",
    ok: true,
    message: "Connected",
    hadPreviousError: true,
  });

  assert.ok(recovery);
  assert.equal(recovery?.resolveAlert, true);

  const noop = buildProviderConnectionActivity({
    providerId: "p1",
    providerName: "Docker",
    providerType: "docker",
    ok: true,
    message: "Connected",
    hadPreviousError: false,
  });

  assert.equal(noop, null);
});

test("buildContainerActionActivity includes provider metadata", () => {
  const activity = buildContainerActionActivity({
    containerId: "abc123",
    containerName: "nginx",
    providerId: "p1",
    providerName: "Portainer",
    action: "restart",
    ok: true,
    message: "Container restarted.",
  });

  assert.equal(activity.type, "container.action.success");
  assert.equal(activity.metadata?.action, "restart");
  assert.equal(activity.metadata?.providerName, "Portainer");
});
