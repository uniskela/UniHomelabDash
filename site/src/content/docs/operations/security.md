---
title: Security hardening
description: Deploy UniHomelabDash within its supported trust boundary.
sidebar:
  order: 2
---

UniHomelabDash is a control-plane application. An authenticated administrator
can make server-side requests, read container logs, and—when explicitly
enabled—start, stop, or restart Docker workloads.

## Supported deployment

- Self-hosted on a trusted LAN or VPN
- Single operator or trusted household
- HTTPS and additional access control before exposure beyond the private network
- Default Compose stack without a Docker socket mount

It is not designed for multi-tenant hosting or a publicly exposed login page.

## Production checklist

1. Generate a long random `SESSION_SECRET`.
2. Keep authentication enabled.
3. Use a reverse proxy with HTTPS.
4. Set `COOKIE_SECURE=true` only after HTTPS works.
5. Set `PUBLIC_URL` to the external origin.
6. Add VPN or identity-aware proxy access if untrusted clients can reach it.
7. Back up the SQLite volume.
8. Use least-privilege provider credentials.
9. Leave provider actions disabled unless you need them.

## Privileged integrations

A Docker socket mount can grant host-level power and is not made safe merely by
adding `:ro`. Unencrypted Docker TCP is similarly privileged. Prefer private
network boundaries, TLS for remote Engines, and explicit action confirmation.

Portainer is read-only in the current release, but its token can still reveal
inventory and logs. Use a dedicated least-privilege account.

## Health checks and logs

Health URLs are fetched by the server and do not have an SSRF allowlist yet.
Only administrators should configure trusted destinations.

Logs may contain sensitive application data. Common secret patterns are
redacted, but no redactor can guarantee complete removal. Review output before
sharing it.

## Report a vulnerability

Use [GitHub Security Advisories](https://github.com/uniskela/UniHomelabDash/security/advisories/new).
Do not open a public issue for an undisclosed vulnerability.
