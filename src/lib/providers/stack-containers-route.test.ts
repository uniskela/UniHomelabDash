import assert from "node:assert/strict";
import test from "node:test";
import { AuthError } from "@/lib/auth/types";
import { createStackContainersGetHandler } from "./stack-containers-route";

test("stack containers route returns 401 when authentication fails", async () => {
  const handler = createStackContainersGetHandler({
    authorize: async () => {
      throw new AuthError("Authentication required.");
    },
    listContainers: async () => ({ kind: "not_found", resources: [] }),
    resourceId: "provider-1:42",
    bypassCache: false,
  });

  const response = await handler();

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Authentication required." });
});

test("stack containers route reports missing stacks without provider details", async () => {
  const handler = createStackContainersGetHandler({
    authorize: async () => ({ id: "user-1", username: "admin" }),
    listContainers: async () => ({ kind: "not_found", resources: [] }),
    resourceId: "provider-1:42",
    bypassCache: false,
  });

  const response = await handler();

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    containers: [],
    reason: null,
    error: "Stack not found.",
    cachedAt: null,
  });
});

test("stack containers route reports disconnected endpoints as unavailable", async () => {
  const handler = createStackContainersGetHandler({
    authorize: async () => ({ id: "user-1", username: "admin" }),
    listContainers: async () => ({
      kind: "unavailable",
      reason: "endpoint_disconnected",
      resources: [],
    }),
    resourceId: "provider-1:42",
    bypassCache: false,
  });

  const response = await handler();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    containers: [],
    reason: "endpoint_disconnected",
    error: null,
    cachedAt: null,
  });
});

test("stack containers route returns safe resources and the membership cache timestamp", async () => {
  const handler = createStackContainersGetHandler({
    authorize: async () => ({ id: "user-1", username: "admin" }),
    listContainers: async () => ({
      kind: "ok",
      resources: [
        {
          id: "7:container-1",
          name: "nextcloud",
          state: "running",
          status: "Up 1 hour",
          image: "nextcloud:latest",
          ports: [],
          providerId: "provider-1",
          providerName: "Primary Portainer",
          endpointId: 7,
          endpointName: "Docker host",
        },
      ],
      cachedAt: 1234,
    }),
    resourceId: "provider-1:42",
    bypassCache: false,
  });

  const response = await handler();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    containers: [
      {
        id: "7:container-1",
        name: "nextcloud",
        state: "running",
        status: "Up 1 hour",
        image: "nextcloud:latest",
        ports: [],
        providerId: "provider-1",
        providerName: "Primary Portainer",
        endpointId: 7,
        endpointName: "Docker host",
      },
    ],
    reason: null,
    error: null,
    cachedAt: 1234,
  });
});

test("stack containers route redacts unexpected provider failures", async () => {
  const handler = createStackContainersGetHandler({
    authorize: async () => ({ id: "user-1", username: "admin" }),
    listContainers: async () => {
      throw new Error("Portainer token SECRET_TOKEN failed");
    },
    resourceId: "provider-1:42",
    bypassCache: false,
  });

  const response = await handler();

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "Could not load stack containers." });
});
