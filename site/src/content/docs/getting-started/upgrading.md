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

- Existing Docker and Portainer container actions remain opt-in; upgrading does
  not grant a provider new action permissions.
- Multiple Docker and Portainer integrations keep separate settings.
- Container inventory uses short process-local caches and endpoint cooldowns;
  no external queue or Redis service is required.

## Upgrading to v0.9.0

1. Rebuild or pull as usual. **No schema migration** or new environment variable
   is required.
2. Container view preferences **auto-upgrade** to a versioned saved-views
   workspace on first load. Hidden containers and filters are preserved.
3. Portainer integrations stay read-only until you enable **Allow container
   actions**. Stack restart and redeploy remain unavailable.
4. Only allowlisted label values are shown in inspect and inventory (Compose
   project, Swarm namespace, OCI title / version / vendor). Env, cmd, healthcheck
   output, and bind mount sources are never returned.

### Dependency notes (v0.9.0)

Compatible patch/minor updates within existing majors were applied where
available. These major upgrades remain deferred and should be evaluated
separately:

- `typescript` 6+/7
- `eslint` 10
- `@types/node` 22+/26
- `better-sqlite3` 13
- `@types/better-sqlite3` 9

After an upgrade, sign in, test each provider connection, and confirm that
services and containers load before removing a backup.
