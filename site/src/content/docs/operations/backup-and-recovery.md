---
title: Backup and recovery
description: Protect SQLite data and recover the administrator account.
sidebar:
  order: 3
---

UniHomelabDash stores services, settings, users, and provider configuration in
SQLite. Docker Compose keeps the database in the `unihomelabdash-data` volume at
`/app/data/unihomelabdash.sqlite`.

## Back up the Compose volume

Stop the application briefly for a consistent file-level copy:

```bash
docker compose stop unihomelabdash
docker run --rm \
  -v unihomelabdash-data:/source:ro \
  -v "$PWD":/backup \
  alpine \
  cp /source/unihomelabdash.sqlite /backup/unihomelabdash.sqlite
docker compose start unihomelabdash
```

Store the backup alongside the matching `SESSION_SECRET` in a secure location.
Encrypted provider credentials cannot be recovered with a different secret.

## Restore

1. Stop the application.
2. Preserve the current database before replacing it.
3. Copy the reviewed backup into the named volume as
   `/app/data/unihomelabdash.sqlite`.
4. Restore the matching `SESSION_SECRET`.
5. Start the application and test sign-in and each provider.

Do not restore an untrusted database file.

## Reset the administrator password

For Docker Compose:

```bash
RESET_ADMIN_PASSWORD='choose-a-new-strong-password' \
  docker compose exec unihomelabdash \
  node scripts/reset-admin.mjs --username admin --confirm
```

For local development:

```bash
npm run reset-admin -- --username admin --confirm
```

The script requires `--confirm`, never prints the password, updates the single
administrator (or creates it if missing), and marks setup complete.
