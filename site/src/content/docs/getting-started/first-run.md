---
title: First-run setup
description: Create the administrator, add a service, and complete your first health check.
sidebar:
  order: 3
---

## Create the administrator

On a fresh database, open UniHomelabDash and complete `/setup`.

- Choose the username and a strong password for the single admin account.
- Setup completion and authenticated sessions use signed, HTTP-only cookies.
- All dashboard routes require authentication unless `AUTH_DISABLED=true` is
  deliberately set for local development.

Production startup stops when `SESSION_SECRET` is missing.

## Add your first service

1. Open **Services**.
2. Select **Add service**.
3. Enter a name and service URL.
4. Optionally add an icon, category, host, notes, and a health-check URL.
5. Save, then use **Open** to visit the service.

The service is stored in the local SQLite database. API tokens and passwords do
not belong in service notes or URLs.

## Run a health check

Select **Check** on the service card, or use **Check all** on the dashboard.

Health checks are server-side HTTP `GET` requests with a five-second timeout.
HTTP 2xx and 3xx responses count as healthy; other responses are degraded. The
server or container running UniHomelabDash must be able to resolve and reach the
health URL.

Checks are on demand. Background polling and notifications are not available
yet.

## Install the PWA

Once the dashboard is reachable from your phone, follow
[Install the PWA](../using/install-the-pwa/) to add it to the home screen.
