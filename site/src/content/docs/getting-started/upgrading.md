---
title: Upgrade UniHomelabDash
description: Rebuild or pull a release while preserving data and safe integration defaults.
sidebar:
  order: 4
---

## Compose installs built from source

```bash
git pull
docker compose up --build -d
```

## Pre-built image installs

Update the image tag, then pull and recreate:

```bash
docker compose pull
docker compose up -d
```

Your SQLite database remains in the `unihomelabdash-data` volume. Startup runs
the included Drizzle migrations before the app begins serving requests.

## Before upgrading

1. Back up the database volume.
2. Keep the existing `SESSION_SECRET`. Rotating it invalidates sessions and
   encrypted provider credentials.
3. Read the release notes for new environment variables and migration notes.
4. Prefer a pinned release tag if you need a controlled rollback point.

## Important upgrade boundaries

- Existing Docker actions remain opt-in; upgrading does not grant a provider
  new action permissions.
- Multiple Docker and Portainer integrations keep separate settings.
- Portainer support in v0.6.2 remains read-only for endpoints, containers, and
  logs. Stack visibility and actions remain planned work.
- Container inventory uses short process-local caches and endpoint cooldowns;
  no external queue or Redis service is required.

After an upgrade, sign in, test each provider connection, and confirm that
services and containers load before removing a backup.
