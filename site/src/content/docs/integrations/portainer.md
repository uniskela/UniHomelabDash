---
title: Portainer
description: Add read-only Portainer endpoints, containers, logs, and stack availability.
sidebar:
  order: 3
---

Portainer support in v0.8.0 is **read-only**. It discovers Docker endpoints,
lists their containers in the shared Containers page, retrieves container logs
through the Portainer Docker gateway, and shows stack availability and lifecycle
status.

## Stack availability and containers

Disconnected endpoints show **Unavailable** on their stack cards. The last
reported lifecycle remains visible for context; UniHomelabDash does not infer
stack health from it.

Connected Docker stack cards open a read-only container membership drawer.
Membership is resolved on the server within the requested provider/integration
and endpoint before exact Compose or Swarm stack-label matching, then returned
as sanitized container display data. **View in Containers** opens the existing
filtered inventory for that container.

The drawer does not retain a prior stack's membership, and disconnected
endpoints do not return cached membership. There is no database migration or
stack membership persistence in v0.8.0. There are **no stack actions**:
restart, redeploy, and other stack changes remain unavailable.

## Create a dedicated token

Create a Portainer access token for a dedicated **least-privilege** user or team.
Give it access only to the endpoints UniHomelabDash needs to display.

## Add the integration

1. Open **Settings → Integrations**.
2. Add a Portainer integration.
3. Enter the base URL, including any reverse-proxy path prefix.
4. Enter the access token.
5. Add a custom CA certificate only when your private HTTPS deployment needs it.
6. Save and run **Test connection**.

Tokens and custom CA certificates are encrypted at rest. The token is sent to
Portainer in the `X-API-Key` header and is never returned to browser storage.

Prefer private HTTPS on Portainer's usual `:9443` endpoint. Do not use a
full-administrator token when a narrower account can read the required
endpoints.

## Partial failures and performance

Container inventory loads endpoints in parallel. A failed endpoint enters a
short cooldown while healthy endpoints continue to render. Results use a short
process-local cache. Stack membership uses the same server-only, short-lived
approach and is never persisted.

| Variable | Default | Purpose |
| --- | ---: | --- |
| `UH_PORTAINER_LIST_TIMEOUT_MS` | `5000` | Per-endpoint container-list timeout |
| `UH_PORTAINER_ENDPOINT_COOLDOWN_MS` | `120000` | Brief skip after an endpoint failure |
| `UH_CONTAINER_LIST_CACHE_MS` | `30000` | Aggregated inventory cache |
| `UH_PORTAINER_REQUEST_TIMEOUT_MS` | `15000` | General Portainer request timeout |
