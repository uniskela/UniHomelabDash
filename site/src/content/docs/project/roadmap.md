---
title: Roadmap
description: What UniHomelabDash has shipped and what the project is focusing on next.
sidebar:
  order: 3
---

UniHomelabDash ships small, polished capabilities before expanding to another
homelab platform.

## Shipped foundation

- Installable mobile-first PWA
- Manual services and on-demand health checks
- Local SQLite persistence
- Single-administrator authentication
- Typed provider system and encrypted credential helper
- Multiple Docker connections, logs, inspect/stats, and opt-in actions
- Portainer endpoints, containers, logs, inspect/stats, and opt-in container actions
- v0.7.0 read-only Portainer stack lifecycle status
- v0.8.0 endpoint-aware stack availability and read-only container membership
- v0.9.0 Container Control Centre: control drawer, saved views, improved logs
- v0.10.0 Alerts and activity feed foundation (in-app events, open alerts)
- Fast asynchronous container inventory, cache, cooldown, and filters
- Container layout, grouping, hidden-item, prefixed-search, and saved-view preferences
- Public GitHub Pages website and core operator/contributor documentation

## Current focus

1. Portainer stack action safety (restart/redeploy remains deferred)
2. Background health polling as a follow-on to alerts foundation

## Release versioning

The project is pre-1.0. Releases may proceed through **v0.10.0**, **v0.25.0**,
and beyond as useful increments ship. **v1.0.0** is an explicit stability
milestone, not an automatic result of reaching a particular number.

## Later

Proxmox, Arr applications, media services, notifications, AI-assisted
troubleshooting, automation, and native wrappers remain future phases. They are
not active features and should not be presented as complete integrations.

The repository
[ROADMAP.md](https://github.com/uniskela/UniHomelabDash/blob/main/ROADMAP.md)
is the source of truth for phase details and scope boundaries.
