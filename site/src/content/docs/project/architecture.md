---
title: Architecture
description: How the single Next.js application separates UI, APIs, providers, data, and security boundaries.
sidebar:
  order: 1
---

UniHomelabDash starts as one Next.js application because a solo-maintained
control plane benefits from one typed codebase and one container. The boundaries
inside that application are deliberate so individual systems can split later
without forcing a premature monorepo.

## Current shape

- **React PWA:** mobile-first dashboard, services, containers, alerts shell, and
  settings UI.
- **Next.js server layer:** authenticated route handlers and server actions.
- **Provider runtime:** capability discovery, connection tests, reads, and
  isolated actions.
- **SQLite + Drizzle:** users, services, settings, and provider instances.
- **Deployment:** one Docker container with a persistent `/app/data` volume.

Provider code and credentials stay server-side. Browser components receive
resource models and allowed capabilities—not connection tokens, TLS keys, or a
Docker socket.

## Trust boundaries

Authentication protects every dashboard route. A provider can fail without
crashing unrelated providers, and disruptive capabilities remain opt-in with
confirmation at the UI and enforcement at the runtime.

The default Compose stack does not mount `/var/run/docker.sock`. Operators
choose privileged connectivity separately after reading the security guidance.

## Growth path

A dedicated worker, Redis queue, split API service, or constrained host agent
should appear only when background polling, alerts, or privileged integrations
require it. Capacitor, Tauri, and native clients remain optional future paths;
the PWA is the current product.

See the repository
[ARCHITECTURE.md](https://github.com/uniskela/UniHomelabDash/blob/main/ARCHITECTURE.md)
for the complete architecture decision.
