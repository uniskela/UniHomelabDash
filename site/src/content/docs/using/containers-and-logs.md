---
title: Containers, logs, and actions
description: Use the Container Control Centre drawer, saved views, and opt-in actions.
sidebar:
  order: 2
---

The **Containers** page aggregates enabled Docker and Portainer integrations.
The page shell loads immediately while inventory requests run asynchronously.

## Find a container

Use host, running/stopped, provider, and free-text filters to narrow the list.
Prefixed search terms can target known fields (`host:`, `name:`, `image:`,
`status:`, `port:`, `label:`, `provider:`, `id:`), including negation and quoted
values.

**Saved views** remember search, filters, sort, grouping, layout, density, and
visible fields. Built-in All / Running / Stopped presets are always available;
you can add named personal views (up to a small limit). Hidden containers stay
global across every view. Existing preferences auto-upgrade to a versioned
workspace on first load after v0.9.0—no manual migration step.

Failed providers are isolated. One slow or unavailable endpoint should produce a
clear partial error instead of taking down the complete page.

## Control drawer

Open a container to use the **control drawer** with three tabs:

1. **Overview** — sanitized inspect detail (state, health status, image,
   networks, safe mounts, limits, and allowlisted label values).
2. **Metrics** — CPU, memory, network, block I/O, and PIDs from a short-lived
   stats snapshot. Turn on live refresh to poll about every five seconds while
   the tab is open (process-local stats cache is five seconds).
3. **Logs** — improved log reader with line-count and severity filters. Docker
   multiplexed stdout/stderr streams are decoded server-side before display.

Inspect results use a short process-local cache (thirty seconds). Routes require
`providerId`; the server resolves the integration from the database and does not
trust a client-supplied provider type for inspect, stats, or actions.

Only selected label **values** are shown (Compose project, Swarm namespace, OCI
title / version / vendor). Environment variables, command arrays, healthcheck
output, and host bind mount sources are never returned to the browser.

Logs can contain application secrets even after common patterns are redacted.
Treat copied output as sensitive and review it before attaching it to an issue.

## Start, stop, and restart

Actions appear only when the individual Docker or Portainer integration allows
them. They are disabled by default (**Allow container actions** in Settings).

Every action:

1. names the exact container;
2. shows provider, endpoint (when present), and current state;
3. explains what will happen;
4. requires confirmation; and
5. calls a fixed Engine start/stop/restart endpoint server-side (directly or
   through the Portainer Docker gateway).

UniHomelabDash does not provide raw shell, terminals, streaming logs, bulk
actions, or arbitrary command execution. Portainer **stack** restart and
redeploy remain unavailable.

## Add a container to the dashboard

The **Add to dashboard** flow opens the manual service form with safe metadata.
Health URL inference uses explicit labels or reachable published ports when
possible and ignores OCI package URLs. Always review the generated URL before
saving it.
