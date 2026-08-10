# UniHomelabDash v0.8.0 Stack Availability and Container Drill-down Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Correct disconnected Portainer stack availability and add an authenticated, read-only, on-demand container drawer for connected Compose and Swarm stacks.

**Architecture:** Normalize Portainer endpoint connectivity independently from reported stack lifecycle, then derive an effective unavailable state at the provider boundary. Resolve stack membership only after a user opens a stack through a provider-scoped server route, exact-match Docker labels server-side, and return a dedicated sanitized container payload to a responsive Sheet.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Node HTTP/HTTPS, Tailwind CSS 4, Radix Sheet, SQLite provider configuration, Node test runner, Docker.

## Global Constraints

- Target release is v0.8.0.
- Portainer remains entirely read-only.
- Disconnected endpoints override visible stack status to unavailable but preserve the reported lifecycle.
- Unavailable stacks do not contribute to Active, Inactive, or Unknown summaries.
- Do not persist stale stack membership and do not add a database migration.
- Do not expose raw labels, environment variables, stack files, credentials, deployment content, or raw API objects.
- Do not add stack actions, container actions, or log controls to the stack drawer.
- Membership must be exact-match, provider-scoped, and endpoint-scoped.
- Docker, Azure, and Kubernetes endpoint boundaries from v0.7.0 remain unchanged.
- Every behavioral task follows a failing-test, minimal-fix, passing-test cycle.

---

## File Structure

### New files

- **src/lib/providers/portainer/stack-containers.ts** — exact Compose/Swarm membership matching and safe container normalization.
- **src/lib/providers/portainer/stack-containers.test.ts** — membership isolation and sanitization coverage.
- **src/lib/providers/stack-membership-cache.ts** — 30-second successful-membership cache.
- **src/lib/providers/stack-membership-cache.test.ts** — cache expiry and invalidation coverage.
- **src/lib/providers/stack-containers-route.ts** — framework-light authenticated route response mapping.
- **src/lib/providers/stack-containers-route.test.ts** — authentication and result-state route coverage.
- **src/lib/providers/stack-container-dispatch.ts** — provider-scoped stable-ID resolution and handler dispatch.
- **src/lib/providers/stack-container-dispatch.test.ts** — cross-provider, disabled-provider, and wrong-provider-type isolation coverage.
- **src/app/api/stacks/[id]/containers/route.ts** — Next.js route adapter.
- **src/components/stack-detail-sheet.tsx** — responsive drawer, request lifecycle, and read-only rows.
- **src/lib/providers/container-query-params.ts** — safe initial q parsing and resource-ID query construction.
- **src/lib/providers/container-query-params.test.ts** — query length, invalid input, and link construction tests.

### Modified files

- **package.json** and **package-lock.json** — version 0.8.0 only; no dependency upgrade is required for this feature.
- **src/lib/providers/types.ts** — endpoint, stack availability, stack container, capability, and provider-handler contracts.
- **src/lib/providers/portainer/client.ts** — endpoint connectivity field.
- **src/lib/providers/portainer/stack-normalize.ts** and test — connectivity normalization, effective status, and stable ID parsing.
- **src/lib/providers/portainer/provider.ts** and test — endpoint-aware stack listing and on-demand membership.
- **src/lib/providers/stack-filters.ts** and test — unavailable counts and filters.
- **src/lib/providers/runtime.ts** — provider-scoped membership dispatch.
- **src/lib/providers/actions.ts** — membership cache invalidation with provider changes.
- **src/lib/providers/stacks-route.ts** and test — explicit stack-list cache bypass on refresh.
- **src/app/api/stacks/route.ts** — refresh query handling.
- **src/components/async-stack-list.tsx** — refresh URL semantics.
- **src/components/stack-list.tsx** — selectable cards, unavailable presentation, and sheet ownership.
- **src/app/containers/page.tsx**, **src/components/async-container-list.tsx**, and **src/components/container-list.tsx** — initial q propagation.
- **src/lib/providers/container-query.ts** and test — exact provider-id and resource-id search prefixes.
- **src/lib/providers/containers-page.test.ts** — shell and query integration contracts.
- **AGENTS.md**, **ROADMAP.md**, **ARCHITECTURE.md**, **SECURITY.md**, **README.md**, **site/src/content/docs/integrations/portainer.md**, **site/src/content/docs/project/roadmap.md**, and **site/tests/site-contract.test.mjs** — v0.8.0 behavior, security boundary, limitations, versioning, upgrade notes, release copy, and documentation contracts.

---

### Task 1: Model Endpoint Connectivity and Effective Stack Status

**Files:**
- Modify: **src/lib/providers/types.ts**
- Modify: **src/lib/providers/portainer/client.ts**
- Modify: **src/lib/providers/portainer/stack-normalize.ts**
- Test: **src/lib/providers/portainer/stack-normalize.test.ts**
- Test: **src/lib/providers/stack-filters.test.ts**
- Test: **src/lib/providers/stack-aggregation.test.ts**
- Test: **src/lib/providers/stack-list-cache.test.ts**
- Test: **src/lib/providers/stacks-route.test.ts**

**Interfaces:**
- Produces: **StackLifecycleStatus**, **EndpointStatus**, **StackStatus**, **normalizePortainerEndpointStatus(value)**, **effectiveStackStatus(reportedStatus, endpointStatus)**, and **parseStackResourceId(resourceId)**.
- Produces: **StackResource.reportedStatus** and **StackResource.endpointStatus** for every stack.
- Consumes: Portainer endpoint status codes 1 and 2 and the existing provider-scoped stack ID format.

- [ ] **Step 1: Add failing normalization and ID parsing tests**

Add cases that prove endpoint connectivity is independent from lifecycle:

    test("normalizePortainerEndpointStatus maps connectivity codes", () => {
      assert.equal(normalizePortainerEndpointStatus(1), "connected");
      assert.equal(normalizePortainerEndpointStatus(2), "disconnected");
      assert.equal(normalizePortainerEndpointStatus(99), "unknown");
      assert.equal(normalizePortainerEndpointStatus(undefined), "unknown");
    });

    test("effectiveStackStatus makes disconnected stacks unavailable", () => {
      assert.equal(effectiveStackStatus("active", "disconnected"), "unavailable");
      assert.equal(effectiveStackStatus("inactive", "disconnected"), "unavailable");
      assert.equal(effectiveStackStatus("active", "connected"), "active");
      assert.equal(effectiveStackStatus("unknown", "unknown"), "unknown");
    });

    test("parseStackResourceId separates provider and provider-local ids", () => {
      assert.deepEqual(parseStackResourceId("provider-1:42"), {
        providerId: "provider-1",
        stackId: "42",
      });
      assert.equal(parseStackResourceId("bad-reference"), null);
      assert.equal(parseStackResourceId(":42"), null);
    });

- [ ] **Step 2: Run the focused test and confirm the red state**

Run:

    npm_lifecycle_event=test node --import tsx --test src/lib/providers/portainer/stack-normalize.test.ts

Expected: FAIL because the new functions and StackResource fields do not exist.

- [ ] **Step 3: Add the typed status contract**

In **types.ts**, replace the current status alias with:

    export type StackLifecycleStatus = "active" | "inactive" | "unknown";
    export type EndpointStatus = "connected" | "disconnected" | "unknown";
    export type StackStatus = StackLifecycleStatus | "unavailable";

Add **reportedStatus** and **endpointStatus** to **StackResource**. Extend the internal **PortainerEndpoint** type in **client.ts** with **Status?: number**.

- [ ] **Step 4: Implement endpoint normalization and effective status**

In **stack-normalize.ts**, add:

    export function normalizePortainerEndpointStatus(
      value: number | undefined
    ): EndpointStatus {
      if (value === 1) return "connected";
      if (value === 2) return "disconnected";
      return "unknown";
    }

    export function effectiveStackStatus(
      reportedStatus: StackLifecycleStatus,
      endpointStatus: EndpointStatus
    ): StackStatus {
      return endpointStatus === "disconnected" ? "unavailable" : reportedStatus;
    }

Change **portainerStackToResource** to accept an optional **endpointStatus** defaulting to unknown, set **reportedStatus**, and derive **status**. The default keeps the provider call site buildable until Task 2 threads the actual endpoint value.

- [ ] **Step 5: Implement strict stable stack ID parsing**

Use the final colon so future provider IDs remain opaque:

    export function parseStackResourceId(resourceId: string) {
      const delimiter = resourceId.lastIndexOf(":");
      const providerId = resourceId.slice(0, delimiter).trim();
      const stackId = resourceId.slice(delimiter + 1).trim();
      return delimiter > 0 && providerId && stackId ? { providerId, stackId } : null;
    }

- [ ] **Step 6: Update existing safe normalization fixtures**

Every StackResource test fixture in stack-normalize, stack-aggregation, stack-filters, stack-list-cache, and stacks-route tests must specify **reportedStatus** and **endpointStatus**. Add an assertion that a disconnected active Portainer item exposes:

    {
      status: "unavailable",
      reportedStatus: "active",
      endpointStatus: "disconnected"
    }

- [ ] **Step 7: Run focused and type checks**

Run:

    npm_lifecycle_event=test node --import tsx --test src/lib/providers/portainer/stack-normalize.test.ts
    npm run typecheck

Expected: normalization tests PASS and typecheck reports zero errors.

- [ ] **Step 8: Commit**

    git add src/lib/providers/types.ts src/lib/providers/portainer/client.ts src/lib/providers/portainer/stack-normalize.ts src/lib/providers/portainer/stack-normalize.test.ts src/lib/providers/stack-aggregation.test.ts src/lib/providers/stack-filters.test.ts src/lib/providers/stack-list-cache.test.ts src/lib/providers/stacks-route.test.ts
    git commit -m "feat: model Portainer endpoint availability"

---

### Task 2: Apply Availability to Stack Listings, Summaries, and Filters

**Files:**
- Modify: **src/lib/providers/portainer/provider.ts**
- Test: **src/lib/providers/portainer/provider.test.ts**
- Modify: **src/lib/providers/stack-filters.ts**
- Test: **src/lib/providers/stack-filters.test.ts**
- Test: **src/lib/providers/stacks-route.test.ts**
- Test: **src/lib/providers/stack-list-cache.test.ts**

**Interfaces:**
- Consumes: **normalizePortainerEndpointStatus**, **StackResource.reportedStatus**, and **StackResource.endpointStatus** from Task 1.
- Produces: unavailable-aware stack inventory, **StackStatusFilter** including unavailable, and summary shape **{ total, active, inactive, unknown, unavailable }**.

- [ ] **Step 1: Write failing provider tests for a disconnected endpoint**

Extend the fake endpoint inventory:

    [
      { Id: 7, Name: "Docker host", Type: 1, Status: 1 },
      { Id: 8, Name: "Nextcloud", Type: 2, Status: 2 },
      { Id: 9, Name: "Kubernetes", Type: 5, Status: 1 }
    ]

Return active stacks for endpoints 7, 8, and 9. Assert endpoint 8 is retained but normalized to unavailable with reported active; endpoint 9 remains excluded.

- [ ] **Step 2: Write failing summary and filter tests**

Add an unavailable fixture and require:

    assert.deepEqual(getStackSummary(stacks), {
      total: 4,
      active: 1,
      inactive: 1,
      unknown: 1,
      unavailable: 1,
    });

Assert **filterStacks(stacks, { status: "unavailable" })** returns only the disconnected stack.

- [ ] **Step 3: Run provider and filter tests to verify failure**

Run:

    npm_lifecycle_event=test node --import tsx --test src/lib/providers/portainer/provider.test.ts src/lib/providers/stack-filters.test.ts

Expected: FAIL because endpoint Status is not passed through and unavailable is not counted.

- [ ] **Step 4: Pass endpoint name and connectivity through the provider**

Replace the endpoint-name map value with:

    {
      name: endpoint.Name?.trim() || "Endpoint " + endpoint.Id,
      status: normalizePortainerEndpointStatus(endpoint.Status)
    }

Pass both fields to **portainerStackToResource**. Keep the existing Docker endpoint-type filter before creating the map.

- [ ] **Step 5: Update summary and filter types**

Add unavailable to **StackStatusFilter** through the extended StackStatus type. Initialize **unavailable: 0** in **getStackSummary**; the existing indexed increment then counts all effective states.

- [ ] **Step 6: Update every stack test fixture**

Update route and cache fixtures with explicit:

    reportedStatus: "active",
    endpointStatus: "connected",

Assert the safe API inventory contains both fields.

- [ ] **Step 7: Run the full provider test group**

Run:

    npm test
    npm run typecheck

Expected: the full test suite, including the new cases, PASS with zero type errors.

- [ ] **Step 8: Commit**

    git add src/lib/providers/portainer/provider.ts src/lib/providers/portainer/provider.test.ts src/lib/providers/stack-filters.ts src/lib/providers/stack-filters.test.ts src/lib/providers/stacks-route.test.ts src/lib/providers/stack-list-cache.test.ts
    git commit -m "fix: mark disconnected Portainer stacks unavailable"

---

### Task 3: Add Exact Server-side Stack Membership

**Files:**
- Create: **src/lib/providers/portainer/stack-containers.ts**
- Test: **src/lib/providers/portainer/stack-containers.test.ts**
- Modify: **src/lib/providers/types.ts**
- Modify: **src/lib/providers/portainer/provider.ts**
- Test: **src/lib/providers/portainer/provider.test.ts**

**Interfaces:**
- Produces: **StackContainerResource**, **ListStackContainersResult**, provider capability **stack.containers**, and optional **ProviderHandler.listStackContainers(context, stackId, options)**.
- Produces: **matchesPortainerStackContainer(item, stack)** and **portainerContainerToStackResource(input)**.
- Consumes: existing **listPortainerEndpoints**, **listPortainerStacks**, **listPortainerEndpointContainers**, normalized endpoint status, and Docker normalization.

- [ ] **Step 1: Write failing membership tests**

Create fixtures with these labels:

    { "com.docker.compose.project": "nextcloud-aio" }
    { "com.docker.stack.namespace": "monitoring" }
    { "com.docker.compose.project": "nextcloud-aio-old" }

Assert:

- Compose nextcloud-aio matches only the exact Compose label.
- Swarm monitoring matches only the exact namespace.
- Unknown stack type accepts either recognized exact label.
- A similarly prefixed project does not match.
- The safe normalized result has no **labels**, **Env**, or raw item field.

- [ ] **Step 2: Run the new test and confirm it fails**

Run:

    npm_lifecycle_event=test node --import tsx --test src/lib/providers/portainer/stack-containers.test.ts

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Add dedicated safe membership types**

In **types.ts**, add:

    export type StackContainerResource = {
      id: string;
      name: string;
      state: ContainerState;
      status: string;
      image: string;
      ports: string[];
      createdAt?: string;
      providerId: string;
      providerName: string;
      endpointId: number;
      endpointName: string;
    };

    export type ListStackContainersResult =
      | { kind: "ok"; resources: StackContainerResource[]; cachedAt?: number }
      | { kind: "unavailable"; reason: "endpoint_disconnected"; resources: [] }
      | { kind: "not_found"; resources: [] };

Add **stack.containers** and:

    listStackContainers?(
      context: ProviderContext,
      stackId: string,
      options?: { bypassCache?: boolean }
    ): Promise<ListStackContainersResult>;

- [ ] **Step 4: Implement exact matching and sanitization**

In **stack-containers.ts**, select the label by stack type:

    const compose = item.Labels?.["com.docker.compose.project"];
    const swarm = item.Labels?.["com.docker.stack.namespace"];

    if (stack.type === "Compose") return compose === stack.name;
    if (stack.type === "Swarm") return swarm === stack.name;
    return compose === stack.name || swarm === stack.name;

Normalize through existing Docker helpers, then construct only the StackContainerResource fields listed above.

- [ ] **Step 5: Write failing provider integration tests**

Add an HTTP fixture that:

- Returns a connected Docker endpoint and Compose stack 42.
- Returns one exact member and one similarly named non-member from the endpoint container API.
- Returns a disconnected endpoint for stack 43.

Assert stack 42 returns **kind: ok** with one safe resource. Assert stack 43 returns **kind: unavailable** and the fake server records no Docker container request for endpoint 8. Assert a missing stack returns **kind: not_found**.

- [ ] **Step 6: Implement the Portainer handler method**

Parse stackId as a positive integer. Fetch endpoints and stacks in parallel, locate the stack, require a supported Docker endpoint, and inspect normalized endpoint status before requesting containers. Filter and sanitize the one endpoint response.

Add **stack.containers** to Portainer capabilities. Do not add it to Docker or manual providers.

- [ ] **Step 7: Run focused, full, and type tests**

Run:

    npm_lifecycle_event=test node --import tsx --test src/lib/providers/portainer/stack-containers.test.ts src/lib/providers/portainer/provider.test.ts
    npm test
    npm run typecheck

Expected: all tests PASS; the disconnected case records zero Docker gateway calls.

- [ ] **Step 8: Commit**

    git add src/lib/providers/types.ts src/lib/providers/portainer/stack-containers.ts src/lib/providers/portainer/stack-containers.test.ts src/lib/providers/portainer/provider.ts src/lib/providers/portainer/provider.test.ts
    git commit -m "feat: resolve Portainer stack containers"

---

### Task 4: Cache Membership and Expose the Authenticated Route

**Files:**
- Create: **src/lib/providers/stack-membership-cache.ts**
- Test: **src/lib/providers/stack-membership-cache.test.ts**
- Modify: **src/lib/providers/portainer/provider.ts**
- Create: **src/lib/providers/stack-containers-route.ts**
- Test: **src/lib/providers/stack-containers-route.test.ts**
- Create: **src/lib/providers/stack-container-dispatch.ts**
- Test: **src/lib/providers/stack-container-dispatch.test.ts**
- Modify: **src/lib/providers/runtime.ts**
- Modify: **src/lib/providers/actions.ts**
- Create: **src/app/api/stacks/[id]/containers/route.ts**

**Interfaces:**
- Produces: **getCachedStackMembership(key, now)**, **setCachedStackMembership(key, resources, now)**, and **invalidateStackMembershipCache()**.
- Produces: **dispatchStackContainerListing(resourceId, options, dependencies)** and runtime **listStackContainerResources(resourceId, options)**.
- Produces: authenticated **GET /api/stacks/[id]/containers**.
- Consumes: **parseStackResourceId** and **ProviderHandler.listStackContainers**.

- [ ] **Step 1: Write failing cache tests**

Require independent keys, 30-second expiry, immutable timestamp return, and global invalidation:

    setCachedStackMembership("provider-1:42", resources, now);
    assert.ok(getCachedStackMembership("provider-1:42", now + 29_999));
    assert.equal(getCachedStackMembership("provider-1:42", now + 30_000), null);
    assert.equal(getCachedStackMembership("provider-2:42", now), null);

- [ ] **Step 2: Implement the focused cache**

Use a module-level Map keyed by the stable stack resource ID. Store only successful safe resources and **cachedAt**. Return a new array when reading so UI code cannot mutate the cached snapshot.

- [ ] **Step 3: Integrate cache after endpoint validation**

In the Portainer handler:

1. Resolve the current endpoint and stack.
2. Return unavailable immediately for disconnected endpoints.
3. If not bypassing, consult the successful membership cache.
4. Otherwise fetch, filter, sanitize, and cache the result.

Do not cache not-found, disconnected, or thrown error results.

- [ ] **Step 4: Write failing route handler tests**

Use injected dependencies to assert:

- AuthError maps to 401.
- not_found maps to 404 with **Stack not found.**
- unavailable maps to 200 with empty containers, reason, null error, and null cachedAt.
- ok maps resources and cachedAt to 200.
- an unexpected provider error is redacted before returning 502.

- [ ] **Step 5: Implement runtime dispatch**

In **stack-container-dispatch.ts**, add a framework-light function with injected exact-ID dependencies:

    export type StackContainerDispatchDependencies = {
      getProviderRow: (providerId: string) => ProviderRow | undefined;
      getHandler: (providerType: ProviderType) => ProviderHandler | null;
      buildContext: (row: ProviderRow) => ProviderContext;
    };

    export async function dispatchStackContainerListing(
      resourceId: string,
      options: { bypassCache?: boolean },
      dependencies: StackContainerDispatchDependencies
    ): Promise<ListStackContainersResult>

Parse the stable ID, look up only the parsed provider ID, and require that exact row to be enabled, type **portainer**, and backed by a handler with **stack.containers** and **listStackContainers**. Pass only the provider-local stack ID into that handler.

Add deterministic tests with two enabled Portainer rows sharing local stack ID 42. Assert **provider-1:42** invokes only provider 1, never provider 2; a Docker row, disabled row, missing provider, and malformed ID all return **kind: not_found** without invoking a handler.

In **runtime.ts**, add:

    export async function listStackContainerResources(
      resourceId: string,
      options: { bypassCache?: boolean } = {}
    )

Delegate to **dispatchStackContainerListing** using adapters around **getProviderRowById**, **toProviderRow**, **getProviderHandler**, and **buildProviderContext**. Return **kind: not_found** for invalid IDs, missing rows, disabled rows, wrong provider types, or unsupported handlers.

- [ ] **Step 6: Implement the framework-light handler and route adapter**

The handler accepts **authorize**, **listContainers**, **resourceId**, and **bypassCache**. The Next adapter uses the already-decoded **params.id** value exactly once, reads **refresh=1**, and passes both values without accepting provider or endpoint query parameters. It must not call **decodeURIComponent** on the dynamic parameter.

- [ ] **Step 7: Invalidate membership on provider changes**

Import **invalidateStackMembershipCache** into **actions.ts** and call it from **revalidateProviderPaths** alongside the existing container and stack invalidations.

- [ ] **Step 8: Run route, cache, and regression tests**

Run:

    npm_lifecycle_event=test node --import tsx --test src/lib/providers/stack-membership-cache.test.ts src/lib/providers/stack-container-dispatch.test.ts src/lib/providers/stack-containers-route.test.ts
    npm test
    npm run typecheck

Expected: all route states and cache boundaries PASS.

- [ ] **Step 9: Commit**

    git add src/lib/providers/stack-membership-cache.ts src/lib/providers/stack-membership-cache.test.ts src/lib/providers/portainer/provider.ts src/lib/providers/stack-container-dispatch.ts src/lib/providers/stack-container-dispatch.test.ts src/lib/providers/stack-containers-route.ts src/lib/providers/stack-containers-route.test.ts src/lib/providers/runtime.ts src/lib/providers/actions.ts src/app/api/stacks/[id]/containers/route.ts
    git commit -m "feat: add authenticated stack membership API"

---

### Task 5: Make Refresh Bypass Stack Caches

**Files:**
- Modify: **src/lib/providers/stacks-route.ts**
- Test: **src/lib/providers/stacks-route.test.ts**
- Modify: **src/app/api/stacks/route.ts**
- Modify: **src/components/async-stack-list.tsx**

**Interfaces:**
- Produces: **GET /api/stacks?refresh=1** calling **listStackResources({ bypassCache: true })**.
- Consumes: existing listStackResources bypass option.

- [ ] **Step 1: Add a failing refresh route test**

Make the injected list function capture its options. Call the handler with a Request containing **refresh=1** and assert:

    assert.deepEqual(receivedOptions, { bypassCache: true });

Also assert a normal request receives **{ bypassCache: false }**.

- [ ] **Step 2: Run the route test and confirm failure**

Run:

    npm_lifecycle_event=test node --import tsx --test src/lib/providers/stacks-route.test.ts

Expected: FAIL because the current handler accepts no Request and passes no options.

- [ ] **Step 3: Thread refresh through the handler**

Change the dependency signature to:

    listStacks: (options: { bypassCache: boolean }) => Promise<StackInventory>

Parse only the exact string value 1 from **request.nextUrl.searchParams** or a standard Request URL.

- [ ] **Step 4: Make the client refresh URL explicit**

In **async-stack-list.tsx**, keep the initial request at **/api/stacks** and use **/api/stacks?refresh=1** after the user presses Refresh. Continue using **cache: no-store** and AbortController.

- [ ] **Step 5: Run focused and full tests**

    npm_lifecycle_event=test node --import tsx --test src/lib/providers/stacks-route.test.ts
    npm test
    npm run typecheck

Expected: refresh bypass and normal caching tests PASS.

- [ ] **Step 6: Commit**

    git add src/lib/providers/stacks-route.ts src/lib/providers/stacks-route.test.ts src/app/api/stacks/route.ts src/components/async-stack-list.tsx
    git commit -m "fix: make stack refresh bypass cache"

---

### Task 6: Add the Responsive Stack Container Sheet

**Files:**
- Create: **src/components/stack-detail-sheet.tsx**
- Modify: **src/components/stack-list.tsx**
- Modify: **src/lib/providers/stack-filters.ts**
- Test: **src/lib/providers/stack-filters.test.ts**
- Test: **src/lib/providers/containers-page.test.ts**

**Interfaces:**
- Consumes: StackResource effective and reported status, StackContainerResource, and **GET /api/stacks/[id]/containers**.
- Produces: keyboard-selectable stack cards, unavailable tile/filter, responsive Sheet, retry behavior, and focus restoration.

- [ ] **Step 1: Add source-contract and status presentation tests**

Extend the existing page source test to require **StackDetailSheet** and **SheetContent** usage. Extend filter tests to prove unavailable text search and counts. Add a source assertion that cards are rendered as buttons with an accessible stack label rather than clickable div elements.

- [ ] **Step 2: Run the tests to verify failure**

Run:

    npm_lifecycle_event=test node --import tsx --test src/lib/providers/stack-filters.test.ts src/lib/providers/containers-page.test.ts

Expected: FAIL because the sheet and unavailable controls do not exist.

- [ ] **Step 3: Add unavailable summary and filter controls**

Add **Unavailable** to statusOptions. Render a fifth StatTile using an error/danger tone and a disconnected icon. Show **Endpoint disconnected** on unavailable cards and ensure the badge text uses the effective status.

- [ ] **Step 4: Make each card a semantic trigger**

Render the card's interactive surface as:

    <button
      type="button"
      aria-label={"View containers for " + stack.name}
      onClick={(event) => openStack(stack, event.currentTarget)}
      className="w-full rounded-xl text-left focus-visible:ring-3 ..."
    >

Store the selected stack and originating HTMLElement in StackList state.

- [ ] **Step 5: Build the sheet request state machine**

In **stack-detail-sheet.tsx**, use the existing Sheet primitives. Accept **stack**, **open**, and **onOpenChange**. On open:

- Abort any prior request.
- Show endpoint unavailable immediately when endpointStatus is disconnected.
- Otherwise fetch the encoded stable stack ID route.
- Map loading, ok, empty, unavailable, 401, 404, 502, and network failure to distinct copy.
- Retry with **refresh=1**.
- Abort on close/unmount.

Use **onCloseAutoFocus** to prevent default and focus the stored originating element.

- [ ] **Step 6: Render safe read-only container rows**

For each StackContainerResource show:

- Name and normalized state badge.
- Image.
- Ports or “No published ports.”
- Creation date when present.

Task 7 adds the **View in Containers** link after its exact query helpers exist. Use **className="data-[side=right]:w-full sm:max-w-xl"** on right-side SheetContent so the component's default three-quarter width is explicitly overridden on phones while larger screens retain a drawer.

- [ ] **Step 7: Run focused, full, type, and lint checks**

    npm_lifecycle_event=test node --import tsx --test src/lib/providers/stack-filters.test.ts src/lib/providers/containers-page.test.ts
    npm test
    npm run typecheck
    npm run lint

Expected: all checks PASS and no nested interactive-element lint errors appear.

- [ ] **Step 8: Commit**

    git add src/components/stack-detail-sheet.tsx src/components/stack-list.tsx src/lib/providers/stack-filters.ts src/lib/providers/stack-filters.test.ts src/lib/providers/containers-page.test.ts
    git commit -m "feat: add stack container drawer"

---

### Task 7: Link Drawer Rows to an Initialized Containers Search

**Files:**
- Create: **src/lib/providers/container-query-params.ts**
- Test: **src/lib/providers/container-query-params.test.ts**
- Modify: **src/app/containers/page.tsx**
- Modify: **src/components/async-container-list.tsx**
- Modify: **src/components/container-list.tsx**
- Modify: **src/components/stack-detail-sheet.tsx**
- Modify: **src/lib/providers/container-query.ts**
- Test: **src/lib/providers/container-query.test.ts**
- Test: **src/lib/providers/containers-page.test.ts**

**Interfaces:**
- Produces: **parseInitialContainerQuery(value, maxLength = 512)** and **buildContainerResourceQuery(providerId, resourceId)**.
- Produces: exact **provider-id:** and **resource-id:** matching in the existing query parser.
- Produces: **ContainerList.initialSearchQuery**.
- Consumes: provider IDs and endpoint-scoped container resource IDs.

- [ ] **Step 1: Write failing pure query tests**

Require:

    assert.equal(parseInitialContainerQuery('provider-id:"provider-1" resource-id:"7:abc"'), 'provider-id:"provider-1" resource-id:"7:abc"');
    assert.equal(parseInitialContainerQuery("x".repeat(513)), "");
    assert.equal(parseInitialContainerQuery(undefined), "");
    assert.equal(
      buildContainerResourceQuery("provider-1", "7:abc"),
      'provider-id:"provider-1" resource-id:"7:abc"'
    );

Accept only a single string value, strip control characters, trim, and enforce 512 characters. Do not decode twice or interpret the query outside the existing parser.

- [ ] **Step 2: Run the new test and confirm failure**

    npm_lifecycle_event=test node --import tsx --test src/lib/providers/container-query-params.test.ts

Expected: FAIL because the helper module does not exist.

- [ ] **Step 3: Implement the narrow query helpers**

**buildContainerResourceQuery** must require non-empty provider and resource IDs, reject embedded quotes or control characters, and quote both values. **parseInitialContainerQuery** returns empty for arrays, oversized input, and control-only input because Next.js searchParams has already URL-decoded the value.

- [ ] **Step 4: Add exact provider and resource query matching**

Extend **ContainerQueryField** and aliases with **provider-id** and **resource-id** while preserving the existing partial **provider:** and **id:** behavior. Match both new terms with strict case-insensitive equality:

    case "providerId":
      return container.providerId?.toLowerCase() === value;
    case "resourceId":
      return container.id.toLowerCase() === value;

- [ ] **Step 5: Pass initial q through the server page**

Update ContainersPage to accept Next.js searchParams, read only **q**, normalize it, and pass **initialSearchQuery** through AsyncContainerList to ContainerList. Initialize state with:

    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

Do not synchronize later browser URL changes into state; q is initial navigation context only.

- [ ] **Step 6: Build View in Containers links**

In the sheet:

    const query = buildContainerResourceQuery(container.providerId, container.id);
    const href = "/containers?q=" + encodeURIComponent(query);

Use Link with the visible label **View in Containers**.

- [ ] **Step 7: Add integration source assertions**

Update **containers-page.test.ts** to require searchParams handling, **initialSearchQuery** propagation, and the exact provider/resource link builder. Keep the existing asynchronous shell assertion.

- [ ] **Step 8: Run all affected checks**

    npm_lifecycle_event=test node --import tsx --test src/lib/providers/container-query-params.test.ts src/lib/providers/container-query.test.ts src/lib/providers/containers-page.test.ts
    npm test
    npm run typecheck
    npm run lint

Expected: query helper, page integration, and all regressions PASS.

- [ ] **Step 9: Commit**

    git add src/lib/providers/container-query-params.ts src/lib/providers/container-query-params.test.ts src/lib/providers/container-query.ts src/lib/providers/container-query.test.ts src/app/containers/page.tsx src/components/async-container-list.tsx src/components/container-list.tsx src/components/stack-detail-sheet.tsx src/lib/providers/containers-page.test.ts
    git commit -m "feat: link stack members to container search"

---

### Task 8: Update v0.8.0 Documentation and Versioning

**Files:**
- Modify: **package.json**
- Modify: **package-lock.json**
- Modify: **AGENTS.md**
- Modify: **ROADMAP.md**
- Modify: **ARCHITECTURE.md**
- Modify: **SECURITY.md**
- Modify: **README.md**
- Modify: **site/src/content/docs/integrations/portainer.md**
- Modify: **site/src/content/docs/project/roadmap.md**
- Test: **site/tests/site-contract.test.mjs**

**Interfaces:**
- Consumes: completed status, API, UI, security, and limitation behavior from Tasks 1–7.
- Produces: version 0.8.0, current operator documentation, pre-1.0 versioning guidance, and prepared release copy.

- [ ] **Step 1: Add failing documentation contract assertions**

Require the Portainer page to mention stack availability, disconnected endpoints, read-only container membership, and no stack actions. Require the project roadmap page to include v0.8.0 and the pre-1.0 example v0.10.0.

- [ ] **Step 2: Run documentation tests and confirm failure**

    npm run site:test

Expected: FAIL on the new v0.8.0 content assertions.

- [ ] **Step 3: Set the application version**

Run:

    npm version 0.8.0 --no-git-tag-version

Review that only root package.json and package-lock.json version fields change.

- [ ] **Step 4: Update project governance and architecture**

- Mark endpoint-aware availability and read-only stack membership complete in ROADMAP.md.
- Set Current Priority in AGENTS.md to v0.8.0 completion and identify the next roadmap focus without expanding implementation.
- Document **stack.containers**, server-only membership matching, endpoint-status precedence, and the no-persistence boundary in ARCHITECTURE.md.
- Document exact-label matching, sanitized membership responses, unavailable handling, and zero secret exposure in SECURITY.md.

- [ ] **Step 5: Update operator and site documentation**

README.md and the Portainer site page must explain:

- Disconnected endpoints show Unavailable.
- Last reported lifecycle is preserved.
- Connected stack cards open a read-only container drawer.
- View in Containers opens the existing filtered inventory.
- No stale membership, database migration, stack actions, or inferred health.
- Pre-1.0 versions may proceed through v0.10.0, v0.25.0, and beyond; v1.0.0 is an explicit stability milestone.

Add prepared GitHub Release title **UniHomelabDash v0.8.0** and public release body.

- [ ] **Step 6: Run documentation and version checks**

    npm run site:test
    npm run site:check
    npm run site:build
    node -p "require('./package.json').version + ' ' + require('./package-lock.json').version"

Expected: site tests/check/build PASS and output is **0.8.0 0.8.0**.

- [ ] **Step 7: Commit**

    git add package.json package-lock.json AGENTS.md ROADMAP.md ARCHITECTURE.md SECURITY.md README.md site/src/content/docs/integrations/portainer.md site/src/content/docs/project/roadmap.md site/tests/site-contract.test.mjs
    git commit -m "docs: prepare v0.8.0 stack container release"

---

### Task 9: Complete Release-gate Verification

**Files:**
- Modify only if a verification failure exposes a v0.8.0 defect; use a failing regression test before each behavioral correction.

**Interfaces:**
- Consumes: final v0.8.0 tree.
- Produces: reproducible release evidence and a clean reviewable branch; does not push, tag, or publish without separate authorization.

- [ ] **Step 1: Perform clean dependency verification**

    npm ci
    npm --prefix site ci
    npm audit
    npm --prefix site audit
    npm outdated --json

Expected: both audits report zero vulnerabilities. Outdated output contains only intentionally deferred major upgrades; document any newly reported compatible patch or minor before proceeding.

- [ ] **Step 2: Run complete application checks**

    npm test
    npm run typecheck
    npm run lint
    npm run build

Expected: all tests PASS; typecheck and lint produce no errors; Next.js lists both stack routes and both workload pages.

- [ ] **Step 3: Run complete documentation checks**

    npm run site:test
    npm run site:check
    npm run site:build

Expected: all documentation contracts pass, Astro reports zero diagnostics, and the static site builds.

- [ ] **Step 4: Run diff and repository checks**

    git diff --check
    git status --short
    git diff --stat v0.7.0...HEAD
    git log --oneline v0.7.0..HEAD

Expected: no whitespace errors, no uncommitted files, and only v0.8.0 design/plan/implementation/documentation commits.

- [ ] **Step 5: Build the final local image**

    docker build --progress=plain -t unihomelabdash:0.8.0-test .

Expected: context excludes .worktrees and site artifacts; Turbopack production build passes; image tag exists locally.

- [ ] **Step 6: Verify live UI states**

Start the production app with authentication disabled and an isolated temporary SQLite database. Use agent-browser to verify:

- Desktop side drawer and phone full-screen sheet.
- Keyboard activation, Escape close, and focus return.
- Connected Compose membership.
- Connected Swarm membership when a fixture is available.
- Disconnected Unavailable status, last reported lifecycle, and no container request.
- Loading, empty, retry, not-found, and provider-failure states.
- View in Containers initializes the provider-scoped id search.
- Dark mode, multiple providers, and duplicate endpoint/stack names.

Record which states were exercised live and which were covered only by deterministic tests.

- [ ] **Step 7: Regression-check privileged container behavior**

Verify authentication, provider settings, standard container inventory, Docker start/stop/restart confirmations, and logs. Do not execute disruptive actions against production containers; use automated tests or an isolated fixture endpoint.

- [ ] **Step 8: Final security review**

Inspect network payloads and source diff to confirm:

- No raw Labels object in the membership API.
- No Env, StackFileContent, credentials, or provider configuration in browser payloads.
- Disconnected endpoints cannot trigger Docker gateway requests.
- Stable resource IDs cannot cross provider boundaries.
- All provider errors are redacted.

- [ ] **Step 9: Commit verification-only fixes if required**

For each defect, create a failing test, apply the minimal correction, rerun the owning checks, and commit:

    git commit -m "fix: address v0.8.0 verification findings"

Skip this step when verification requires no code change.

- [ ] **Step 10: Prepare integration handoff**

Report the branch name, commits, release diff, audit results, test totals, build results, browser coverage, Docker image ID, known limitations, and prepared v0.8.0 release text. Do not create the tag until main is merged and its CI succeeds.
