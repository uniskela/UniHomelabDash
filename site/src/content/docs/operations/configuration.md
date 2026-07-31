---
title: Configuration reference
description: Environment variables for deployment, auth, providers, and development.
sidebar:
  order: 1
---

Docker Compose reads `.env` from the repository root. Local Next.js development
can use `.env.local`. Never commit either file.

| Variable | Default | Use |
| --- | --- | --- |
| `DATABASE_PATH` | `./data/unihomelabdash.sqlite` locally | SQLite database path; Compose sets `/app/data/unihomelabdash.sqlite` |
| `HOST_PORT` | `3000` | Host port mapped to container port 3000 |
| `SESSION_SECRET` | none | Required in production for signed cookies and provider encryption |
| `AUTH_DISABLED` | `false` | Development-only authentication bypass; never use in production |
| `COOKIE_SECURE` | `false` | Set `true` only when the browser reaches the app over HTTPS |
| `PUBLIC_URL` | empty | Preferred public origin for redirects behind a reverse proxy |
| `TRUST_PROXY_HEADERS` | `false` | Trust forwarded origin headers only behind a sanitizing proxy |
| `ALLOWED_HOSTS` | empty | Comma-separated forwarded hosts allowed when proxy trust is enabled |
| `DOCKER_GID` | `999` in the example override | Host Docker group used for local socket permissions |
| `ALLOWED_DEV_ORIGIN` | empty | Additional LAN origin for Next.js development HMR |
| `UH_PORTAINER_LIST_TIMEOUT_MS` | `5000` | Portainer endpoint inventory timeout |
| `UH_PORTAINER_ENDPOINT_COOLDOWN_MS` | `120000` | Portainer failed-endpoint cooldown |
| `UH_CONTAINER_LIST_CACHE_MS` | `30000` | Process-local aggregated container cache |
| `UH_PORTAINER_REQUEST_TIMEOUT_MS` | `15000` | General Portainer request timeout |
| `UH_DOCKER_REQUEST_TIMEOUT_MS` | `15000` | General Docker request timeout |

## Reverse proxy example

For a dashboard served at `https://dash.example.com`:

```dotenv
COOKIE_SECURE=true
PUBLIC_URL=https://dash.example.com
```

`PUBLIC_URL` is safer and simpler than trusting forwarded headers. If proxy
headers are required, the proxy must overwrite untrusted `X-Forwarded-*` values:

```dotenv
TRUST_PROXY_HEADERS=true
ALLOWED_HOSTS=dash.example.com
```

Keep `SESSION_SECRET` long, random, private, and stable:

```bash
openssl rand -base64 32
```
