---
title: Services and health checks
description: Organize manual services and check their health on demand.
sidebar:
  order: 1
---

Manual services make UniHomelabDash useful before any privileged integration is
enabled.

## Service fields

| Field | Purpose |
| --- | --- |
| Name | Clear card and navigation label |
| URL | Address opened by the **Open** action |
| Icon | Short icon, emoji, or visual identifier |
| Category | Groups related applications |
| Host | Records the device or system serving it |
| Notes | Non-sensitive operator context |
| Health-check URL | Address fetched by the server when you run a check |

Edit or delete services from the **Services** page overflow menu. The dashboard
is optimized for quick status and opening applications.

## Health states

- **Healthy** — the configured URL returned HTTP 2xx or 3xx.
- **Degraded** — the request completed with another status or a useful error.
- **Unknown** — no check has run yet, or no health URL is configured.

The last-checked timestamp helps distinguish a current result from old state.
Use **Check all** when you want a fresh snapshot.

## Attention-first behavior

Cards needing attention are presented before healthy cards so a phone-sized
dashboard answers the most important question first. When a check transitions
to **degraded**, v0.10.0 records an open alert and activity event — open
**Alerts and activity** from Settings or the dashboard shortcut.

Checks still do not run in the background and there are no push notifications.

## Safe health URLs

Only add addresses you trust the UniHomelabDash server to request. Health checks
are server-side and there is no SSRF allowlist in the current release. Never put
credentials in a health URL.
