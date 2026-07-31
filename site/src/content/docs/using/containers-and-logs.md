---
title: Containers, logs, and actions
description: Review aggregated container state and use explicitly enabled actions.
sidebar:
  order: 2
---

The **Containers** page aggregates enabled Docker and Portainer integrations.
The page shell loads immediately while inventory requests run asynchronously.

## Find a container

Use host, running/stopped, and free-text filters to narrow the list. Prefixed
search terms can target known fields. Container details show provider, host,
image, ports, state, creation or uptime information, and labels when expanded.

Failed providers are isolated. One slow or unavailable endpoint should produce a
clear partial error instead of taking down the complete page.

## Read logs

Open a container and select its logs view. Choose a line count and severity
filter for quick diagnosis. Docker multiplexed stdout/stderr streams are decoded
server-side before display.

Logs can contain application secrets even after common patterns are redacted.
Treat copied output as sensitive and review it before attaching it to an issue.

## Start, stop, and restart

Docker actions appear only when the individual integration allows actions.
They are disabled by default.

Every action:

1. names the exact container and provider;
2. shows what will happen;
3. requires confirmation; and
4. calls a fixed Docker Engine endpoint server-side.

UniHomelabDash does not provide raw shell or arbitrary command execution.
Portainer containers are read-only in v0.6.2.

## Add a container to the dashboard

The **Add to dashboard** flow opens the manual service form with safe metadata.
Health URL inference uses explicit labels or reachable published ports when
possible and ignores OCI package URLs. Always review the generated URL before
saving it.
