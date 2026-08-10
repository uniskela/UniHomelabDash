import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesPortainerStackContainer,
  portainerContainerToStackResource,
} from "./stack-containers";
import type { StackResource } from "@/lib/providers/types";

const composeStack: StackResource = {
  id: "portainer-1:42",
  name: "nextcloud-aio",
  status: "active",
  reportedStatus: "active",
  endpointStatus: "connected",
  type: "Compose",
  endpointId: 7,
  endpointName: "Docker host",
  providerId: "portainer-1",
  providerName: "Portainer",
};

const swarmStack: StackResource = {
  ...composeStack,
  id: "portainer-1:43",
  name: "monitoring",
  type: "Swarm",
};

const unknownStack: StackResource = {
  ...composeStack,
  id: "portainer-1:44",
  name: "monitoring",
  type: "Unknown",
};

test("matchesPortainerStackContainer uses exact labels for Compose, Swarm, and unknown stacks", () => {
  const composeMember = {
    Id: "compose",
    Labels: { "com.docker.compose.project": "nextcloud-aio" },
  };
  const swarmMember = {
    Id: "swarm",
    Labels: { "com.docker.stack.namespace": "monitoring" },
  };
  const similarlyNamed = {
    Id: "old-compose",
    Labels: { "com.docker.compose.project": "nextcloud-aio-old" },
  };

  assert.equal(matchesPortainerStackContainer(composeMember, composeStack), true);
  assert.equal(matchesPortainerStackContainer(swarmMember, composeStack), false);
  assert.equal(matchesPortainerStackContainer(swarmMember, swarmStack), true);
  assert.equal(matchesPortainerStackContainer(composeMember, swarmStack), false);
  assert.equal(matchesPortainerStackContainer(swarmMember, unknownStack), true);
  assert.equal(matchesPortainerStackContainer(similarlyNamed, composeStack), false);
});

test("portainerContainerToStackResource omits labels and raw Docker fields", () => {
  const resource = portainerContainerToStackResource({
    stack: composeStack,
    item: {
      Id: "container-1",
      Names: ["/nextcloud"],
      Image: "nextcloud:latest",
      State: "running",
      Status: "Up 1 hour",
      Created: 1_700_000_000,
      Ports: [{ PrivatePort: 80, PublicPort: 8080, Type: "tcp" }],
      Labels: { "com.docker.compose.project": "nextcloud-aio" },
      Env: ["SECRET=value"],
    },
  });

  assert.deepEqual(resource, {
    id: "7:container-1",
    name: "nextcloud",
    state: "running",
    status: "Up 1 hour",
    image: "nextcloud:latest",
    ports: ["8080:80/tcp"],
    createdAt: "2023-11-14T22:13:20.000Z",
    providerId: "portainer-1",
    providerName: "Portainer",
    endpointId: 7,
    endpointName: "Docker host",
  });
  assert.equal("labels" in resource, false);
  assert.equal("Env" in resource, false);
  assert.equal("item" in resource, false);
});
