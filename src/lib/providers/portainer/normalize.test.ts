import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPortainerResourceId,
  endpointHostFromPortainerEndpoint,
  parsePortainerResourceId,
  portainerContainerToProviderResource,
} from "./normalize";

test("parsePortainerResourceId round-trips a composite resource id", () => {
  const id = buildPortainerResourceId(3, "abc123");
  assert.equal(id, "3:abc123");
  assert.deepEqual(parsePortainerResourceId(id), { endpointId: 3, containerId: "abc123" });
});

test("parsePortainerResourceId rejects invalid ids", () => {
  assert.equal(parsePortainerResourceId("abc"), null);
  assert.equal(parsePortainerResourceId("1:"), null);
});

test("portainerContainerToProviderResource enriches endpoint metadata", () => {
  const resource = portainerContainerToProviderResource({
    endpointId: 7,
    endpointName: "Lab host",
    endpointHost: "192.168.1.50",
    providerId: "provider-1",
    item: {
      Id: "container-1",
      Names: ["/nginx"],
      Image: "nginx:latest",
      State: "running",
      Status: "Up 2 minutes",
    },
  });

  assert.equal(resource.providerType, "portainer");
  assert.equal(resource.id, "7:container-1");
  assert.equal(resource.meta?.endpointName, "Lab host");
  assert.equal(resource.meta?.providerHost, "192.168.1.50");
});

test("endpointHostFromPortainerEndpoint prefers PublicURL and skips sockets", () => {
  assert.equal(
    endpointHostFromPortainerEndpoint({
      PublicURL: "https://edge.lab.local",
      URL: "tcp://10.0.0.8:2375",
    }),
    "edge.lab.local"
  );
  assert.equal(
    endpointHostFromPortainerEndpoint({
      URL: "tcp://10.0.0.8:2375",
    }),
    "10.0.0.8"
  );
  assert.equal(
    endpointHostFromPortainerEndpoint({
      URL: "unix:///var/run/docker.sock",
    }),
    undefined
  );
});
