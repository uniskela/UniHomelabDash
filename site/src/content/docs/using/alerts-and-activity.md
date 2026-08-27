---
title: Alerts and activity
description: Review open alerts and the in-app activity feed from health checks and container actions.
sidebar:
  order: 3
---

v0.10.0 adds an in-app **Alerts and activity** page. This is a foundation for
later notification channels — push, Discord, and webhooks remain planned.

## What gets recorded

| Event | When | Severity |
| --- | --- | --- |
| Service degraded | Manual health check transitions to degraded | Warning |
| Service recovered | Manual check returns healthy after degraded | Info |
| Provider connection failed | Connection test fails | Error |
| Provider connection restored | Connection test succeeds after a prior failure | Info |
| Container action | Start, stop, or restart succeeds or fails | Info / warning |

Checks still run **on demand** only. No background polling creates alerts yet.

## Active alerts

Open alerts appear when:

- A service health check transitions to **degraded**
- A provider connection test fails

Each alert can be **Acknowledged** or **Resolved**. Resolving clears the open
item; a new failure creates a fresh alert.

Recovery events (healthy again, connection restored) resolve matching open
alerts automatically.

## Activity feed

The feed shows the most recent recorded events, including container actions.
Use it as a lightweight audit trail for homelab operations performed through
UniHomelabDash.

## Retention

Activity events are pruned after **30 days** by default. Set
`ACTIVITY_RETENTION_DAYS` in the environment to override.

## API

Authenticated routes (same session cookie as the dashboard):

- `GET /api/activities?limit=50`
- `GET /api/alerts?scope=open|recent&limit=50`

## What is not included yet

- Push notifications or external webhooks
- Background health polling
- Per-service notification rules or quiet hours

Open **Settings → Alerts** or use the dashboard shortcut when items need
attention.
