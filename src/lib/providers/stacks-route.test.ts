import assert from "node:assert/strict";
import test from "node:test";
import { AuthError } from "@/lib/auth/types";
import { createStacksGetHandler } from "./stacks-route";

test("stacks route returns 401 when authentication fails", async () => {
  const handler = createStacksGetHandler({
    authorize: async () => {
      throw new AuthError("Authentication required.");
    },
    listStacks: async () => ({ resources: [], cachedAt: 0 }),
  });

  const response = await handler();

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Authentication required." });
});

test("stacks route returns the safe inventory payload", async () => {
  const handler = createStacksGetHandler({
    authorize: async () => ({ id: "user-1", username: "admin" }),
    listStacks: async () => ({
      resources: [
        {
          id: "provider-1:42",
          name: "media",
          status: "active" as const,
          reportedStatus: "active" as const,
          endpointStatus: "connected" as const,
          type: "Compose" as const,
          endpointId: 7,
          endpointName: "Docker host",
          providerId: "provider-1",
          providerName: "Primary Portainer",
        },
      ],
      warning: "Backup Portainer: timed out.",
      cachedAt: 1234,
    }),
  });

  const response = await handler();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    stacks: [
      {
        id: "provider-1:42",
        name: "media",
        status: "active",
        reportedStatus: "active",
        endpointStatus: "connected",
        type: "Compose",
        endpointId: 7,
        endpointName: "Docker host",
        providerId: "provider-1",
        providerName: "Primary Portainer",
      },
    ],
    error: null,
    warning: "Backup Portainer: timed out.",
    cachedAt: 1234,
  });
});
