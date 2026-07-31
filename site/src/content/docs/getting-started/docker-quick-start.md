---
title: Docker quick start
description: Run UniHomelabDash with Docker Compose and persistent local data.
sidebar:
  order: 2
---

The default Compose stack is the smallest recommended production-style install.
It stores SQLite data in a named volume and does **not** mount the Docker socket.

## 1. Clone the project

```bash
git clone https://github.com/uniskela/UniHomelabDash.git
cd UniHomelabDash
```

## 2. Create a session secret

Create `.env` in the repository root:

```bash
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
```

Keep this value private and stable. Changing it signs every admin session out
and prevents previously encrypted provider credentials from being decrypted.

## 3. Start the stack

```bash
docker compose up --build -d
```

Open [http://localhost:3000](http://localhost:3000). The first visit redirects
to `/setup`, where you create the single administrator account.

The Compose volume `unihomelabdash-data` is mounted at `/app/data`. Rebuilding
or replacing the application container does not remove that volume.

## Use another port

If port 3000 is already in use:

```bash
HOST_PORT=3003 docker compose up --build -d
```

Then open `http://localhost:3003`.

## Use a pre-built image

You can replace `build: .` in an override file with either public image:

```yaml
services:
  unihomelabdash:
    image: ghcr.io/uniskela/unihomelabdash:latest
    # image: uniskela/unihomelabdash:latest
```

Pin a `vX.Y.Z` or `X.Y.Z` tag when repeatable deployments matter.

## Before remote access

UniHomelabDash is intended for a trusted LAN or VPN. Before making it reachable
beyond that boundary, use HTTPS, set `COOKIE_SECURE=true`, configure
`PUBLIC_URL`, and add access control at the reverse proxy or VPN layer. Read the
[security guide](../../operations/security/) before enabling provider actions.
