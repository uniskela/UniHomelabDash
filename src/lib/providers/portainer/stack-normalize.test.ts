import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePortainerStackStatus,
  normalizePortainerStackType,
  portainerStackToResource,
} from "./stack-normalize";

test("normalizePortainerStackStatus maps lifecycle codes and unknown values", () => {
  assert.equal(normalizePortainerStackStatus(1), "active");
  assert.equal(normalizePortainerStackStatus(2), "inactive");
  assert.equal(normalizePortainerStackStatus(99), "unknown");
  assert.equal(normalizePortainerStackStatus(undefined), "unknown");
});

test("normalizePortainerStackType maps Portainer stack types", () => {
  assert.equal(normalizePortainerStackType(1), "Swarm");
  assert.equal(normalizePortainerStackType(2), "Compose");
  assert.equal(normalizePortainerStackType(3), "Kubernetes");
  assert.equal(normalizePortainerStackType(99), "Unknown");
});

test("portainerStackToResource exposes only safe stack metadata", () => {
  const resource = portainerStackToResource({
    providerId: "provider-1",
    providerName: "Primary Portainer",
    endpointName: "Docker host",
    item: {
      Id: 42,
      Name: "media",
      Type: 2,
      EndpointId: 7,
      Status: 1,
      CreationDate: 1_700_000_000,
      UpdateDate: 1_700_003_600,
      Env: [{ name: "API_TOKEN", value: "secret" }],
      StackFileContent: "services: {}",
    },
  });

  assert.deepEqual(resource, {
    id: "provider-1:42",
    name: "media",
    status: "active",
    type: "Compose",
    endpointId: 7,
    endpointName: "Docker host",
    providerId: "provider-1",
    providerName: "Primary Portainer",
    createdAt: "2023-11-14T22:13:20.000Z",
    updatedAt: "2023-11-14T23:13:20.000Z",
  });
  assert.equal("Env" in resource, false);
  assert.equal("StackFileContent" in resource, false);
});

test("portainerStackToResource safely defaults missing fields", () => {
  const resource = portainerStackToResource({
    providerId: "provider-2",
    providerName: "Backup Portainer",
    endpointName: "Endpoint 9",
    item: { Id: 8, EndpointId: 9 },
  });

  assert.equal(resource.name, "Stack 8");
  assert.equal(resource.status, "unknown");
  assert.equal(resource.type, "Unknown");
  assert.equal(resource.createdAt, undefined);
  assert.equal(resource.updatedAt, undefined);
});
