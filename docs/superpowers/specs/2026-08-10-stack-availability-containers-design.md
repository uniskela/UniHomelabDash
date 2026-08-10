# UniHomelabDash v0.8.0 Stack Availability and Container Drill-down Design

## Summary

UniHomelabDash currently presents Portainer's persisted stack lifecycle status as if it also proved that the stack's endpoint is reachable. Portainer reports those facts separately: **/api/stacks** reports the last known deployment lifecycle, while **/api/endpoints** reports current endpoint connectivity. A stack can therefore remain lifecycle-active while its endpoint is disconnected.

v0.8.0 will model those states separately, show disconnected stacks as unavailable, and add a read-only, on-demand container drill-down. Selecting a stack opens a responsive side drawer on tablet and desktop and a full-screen sheet on phones. Containers are resolved and filtered server-side within the selected Portainer provider and endpoint.

## Goals

- Show stacks on disconnected Portainer endpoints as unavailable.
- Exclude unavailable stacks from the active lifecycle summary.
- Preserve and display the stack's last reported Portainer lifecycle.
- Let an authenticated user select a connected stack and see its current containers.
- Keep stack membership lookup read-only, provider-scoped, endpoint-scoped, and server-only.
- Reuse the existing Containers page for deeper container interaction.
- Preserve mobile usability, keyboard navigation, focus management, partial-failure behavior, and secret redaction.

## Non-goals

- Stack start, stop, restart, redeploy, delete, or edit actions.
- Container actions or log viewing inside the stack drawer.
- Stack deployment files, environment variables, credentials, or raw Portainer objects.
- Persisting stale container membership.
- Inferring stack health from container health.
- Kubernetes or Azure endpoint support.
- A database migration.

## Root Cause

**normalizePortainerStackStatus** currently maps Portainer stack status code 1 to active without considering the associated endpoint record. Portainer keeps that lifecycle value after an Agent or Edge Agent disconnects. The endpoint inventory already accompanies the stack request, but its connectivity status is not part of the local **PortainerEndpoint** or **StackResource** contracts.

The fix belongs at the provider normalization boundary. The UI should not attempt to infer connectivity from failed container requests, timestamps, or stack lifecycle values.

## Status Model

Add these typed states:

    type StackLifecycleStatus = "active" | "inactive" | "unknown";
    type EndpointStatus = "connected" | "disconnected" | "unknown";
    type StackStatus = StackLifecycleStatus | "unavailable";

**StackResource** will expose:

    type StackResource = {
      id: string;
      name: string;
      status: StackStatus;
      reportedStatus: StackLifecycleStatus;
      endpointStatus: EndpointStatus;
      type: StackType;
      endpointId: number;
      endpointName: string;
      providerId: string;
      providerName: string;
      createdAt?: string;
      updatedAt?: string;
    };

Portainer endpoint status code 1 normalizes to connected, code 2 to disconnected, and missing or unrecognized values to unknown.

Effective stack status follows this precedence:

1. A disconnected endpoint produces unavailable.
2. A connected or unknown endpoint preserves the normalized reported lifecycle.
3. The original lifecycle remains available as **reportedStatus** so the drawer can say, for example, “Last reported: Active.”

Unavailable stacks have their own summary count and filter option and do not contribute to Active, Inactive, or Unknown. Total continues to include every returned stack.

## Provider Contract and Data Flow

Add the **stack.containers** provider capability and an optional handler method:

    listStackContainers?(
      context: ProviderContext,
      stackId: string
    ): Promise<ListStackContainersResult>;

Only Portainer implements it.

The stack listing flow remains a paired request for endpoint inventory and stack inventory. The provider maps each supported Docker endpoint to its name and normalized connectivity, then passes both the endpoint status and reported lifecycle into safe stack normalization.

Container membership is fetched only when the user opens a stack:

1. The authenticated route receives the stable provider-scoped stack ID.
2. The server resolves the enabled Portainer provider from that ID.
3. The provider refetches or reuses the short-lived safe stack and endpoint inventory and verifies that the requested stack belongs to that provider and a supported Docker endpoint.
4. If the endpoint is disconnected, it returns a typed unavailable result without calling the Docker gateway.
5. If connected or connectivity is unknown, it lists that endpoint's current containers once.
6. Compose membership requires an exact **com.docker.compose.project** label match to the resolved stack name.
7. Swarm membership requires an exact **com.docker.stack.namespace** label match.
8. Unknown stack types may test both recognized membership labels but still require an exact value, provider, and endpoint match.
9. The provider returns a dedicated sanitized container contract without raw labels.

This design avoids an N+1 request on the main stacks page, avoids sending all container inventory to the browser, and prevents the browser from selecting arbitrary provider or endpoint IDs.

## Stack Container API

Add authenticated **GET /api/stacks/[id]/containers**.

Successful connected response:

    {
      "containers": [],
      "unavailable": false,
      "error": null,
      "cachedAt": 1786344000000
    }

Disconnected response:

    {
      "containers": [],
      "unavailable": true,
      "reason": "endpoint_disconnected",
      "error": null,
      "cachedAt": null
    }

The safe container item contains only:

- Stable provider resource ID.
- Name.
- Normalized state and display status.
- Image.
- Published ports.
- Creation timestamp when supplied.
- Provider ID/name.
- Endpoint ID/name.

The route returns:

- 401 for an unauthenticated request.
- 404 when the provider or stack cannot be resolved.
- A redacted provider error for timeouts, malformed responses, and HTTP failures.

Successful membership results use a separate 30-second in-memory cache keyed by provider ID and Portainer stack ID. The provider checks the associated endpoint state before consulting membership data; disconnected and failed results are not added to the membership cache. Provider create, update, enable/disable, and delete operations invalidate container, stack, and stack-membership caches. Explicit refresh bypasses the applicable stack and membership caches. No membership is retained after cache expiry or process restart.

## User Interface

### Stack list

- Stack cards become semantic keyboard-accessible buttons while retaining their current card layout.
- An unavailable stack uses a distinct red status badge and an “Endpoint disconnected” label.
- Summary tiles become Total, Active, Inactive, Unknown, and Unavailable.
- The status filter gains Unavailable.
- The search and endpoint filters continue to work unchanged.

### Responsive drawer

- Tablet and desktop use a right-side drawer that keeps the filtered stack list visible.
- Phones use the same component as a full-screen sheet.
- Opening begins an abortable membership request.
- Closing cancels the request and restores focus to the originating stack card.
- The header shows stack name, effective status, reported lifecycle, type, endpoint, and provider.

Connected stacks render read-only container rows with name, state, image, ports, and creation time. Each row has a **View in Containers** link; no container actions or log controls appear in the drawer.

Disconnected stacks render:

- “Containers unavailable while endpoint is disconnected.”
- The last reported stack lifecycle.
- No stale or inferred container membership.

Distinct drawer states cover loading, no containers, endpoint unavailable, stack not found, authentication failure, provider failure, retry, and refresh.

### Containers-page link

The Containers page will accept one optional, length-limited **q** query parameter and use it only as the initial value of the existing search field. **View in Containers** supplies the full provider-scoped container resource ID through the existing **id:** search prefix, which uniquely carries the Portainer endpoint and Docker container ID. The existing query parser remains authoritative. Missing, oversized, or invalid values fall back to the current unfiltered behavior.

## Error Handling and Security

- Credentials and Portainer requests remain server-only.
- The browser cannot choose the membership label, provider type, or endpoint independently of the stable stack ID.
- Membership comparisons use exact label values rather than substring or name-prefix matching.
- Raw Docker labels, Portainer environment data, stack files, and deployment content never enter the response.
- Provider and HTTP errors pass through the existing secret redactor.
- A disconnected endpoint is a normal unavailable state, not a provider failure.
- A container request failure does not rewrite endpoint connectivity or reported lifecycle.
- Healthy stack results remain visible when another Portainer provider fails.

## Testing

### Unit and provider tests

- Endpoint connectivity code normalization and unknown fallback.
- Effective status precedence and preservation of reported lifecycle.
- Unavailable summary and filter behavior.
- Compose and Swarm exact-label membership.
- Rejection of similarly named stacks.
- Provider and endpoint isolation.
- Unknown stack-type fallback.
- Disconnected endpoints never invoke the Docker gateway.
- Safe container normalization excludes raw labels and sensitive fields.
- Membership cache expiry and all provider-change invalidations.

### Client and route tests

- Prefixed Portainer paths, API-key authentication, custom CA, timeout, malformed response, and HTTP errors.
- Authentication, missing provider, missing stack, disconnected endpoint, empty membership, success, and redacted failure responses.
- The stack page continues loading its shell without blocking on endpoint or membership calls.

### UI and regression tests

- Keyboard activation and focus restoration.
- Desktop drawer and phone full-screen sheet.
- Loading, empty, unavailable, retry, and no-filter-result states.
- Safe **q** initialization and provider-scoped **id:** links from the drawer.
- Dark mode and responsive layouts.
- Multiple Portainer providers with duplicate stack or endpoint names.
- Regression coverage for authentication, provider settings, container listing, Docker actions, and logs.

## Documentation and Versioning

- Ship the combined availability correction and container drill-down as v0.8.0 because **stack.containers** is a new user-facing/provider capability.
- Update AGENTS.md, ROADMAP.md, ARCHITECTURE.md, SECURITY.md, README.md, and the Portainer documentation site page.
- Document that UniHomelabDash may continue with valid pre-1.0 minor versions such as v0.10.0, v0.25.0, and v0.99.0. Reaching v0.9.0 does not force v1.0.0.
- Reserve v1.0.0 for an explicit stability and compatibility milestone.

## Acceptance Criteria

- A Portainer stack whose endpoint reports disconnected is shown as Unavailable and is excluded from Active.
- Its drawer shows the last reported lifecycle but no stale containers.
- A connected Compose or Swarm stack shows only its current exact-match containers.
- Container rows can open the Containers page with a provider-scoped resource-ID filter.
- No stack or container actions are introduced.
- No secret, raw stack object, unrestricted label set, or deployment content reaches the frontend.
- Existing providers and container functionality remain green through the complete verification suite.
