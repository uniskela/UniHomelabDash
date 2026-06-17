# Security

UniHomelabDash requires authentication for dashboard access. Read this before deploying.

## Supported use

- Self-hosted on a **trusted homelab network** (LAN or VPN)
- Single-operator or small household where the admin credentials are protected
- Docker Compose with the default setup (no Docker socket mount)

## Software sources

- **Official releases:** [GitHub](https://github.com/uniskela/UniHomelabDash) source; container images on `ghcr.io/uniskela/unihomelabdash` and [Docker Hub](https://hub.docker.com/r/uniskela/unihomelabdash) (`uniskela/unihomelabdash`)
- Do not rely on unlisted third-party mirrors or internal maintainer registries for production installs

## Authentication

- First visit runs **first-run setup** at `/setup` to create a single admin account.
- Subsequent visits require **username and password** login.
- Sessions use a signed, HTTP-only cookie (`uh_session`) backed by `SESSION_SECRET`.
- Setup completion is tracked with a signed cookie (`uh_setup`) so middleware can route correctly without database access on the edge.

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `SESSION_SECRET` | **Yes in production** | HMAC secret for session and setup cookies |
| `COOKIE_SECURE` | No | Set to `true` only when served over HTTPS (reverse proxy with TLS). Default off for LAN HTTP. |
| `PUBLIC_URL` | No | Public origin for auth redirects behind a reverse proxy (e.g. `https://dash.pike.homes`). Preferred over trusting proxy headers. |
| `TRUST_PROXY_HEADERS` | No | Set to `true` only behind a reverse proxy that strips spoofed `X-Forwarded-*` headers. Requires `ALLOWED_HOSTS`. Default off. |
| `ALLOWED_HOSTS` | No | Comma-separated hostnames allowed in `X-Forwarded-Host` when `TRUST_PROXY_HEADERS=true`. |
| `AUTH_DISABLED` | No | Set to `true` to bypass auth in development only |

Production startup fails if `SESSION_SECRET` is missing while authentication is enabled.

**Never set `AUTH_DISABLED=true` in production.**

## Unsupported use

- **Public internet exposure** without HTTPS and additional access control in front of the app
- Multi-tenant or shared hosting where untrusted users can reach the login page
- Storing API tokens, passwords, or secrets in service notes (not designed for secrets)

Anyone with valid admin credentials can manage services and trigger health checks.

## Before exposing beyond your LAN

1. Put UniHomelabDash behind a reverse proxy (nginx, Caddy, Traefik) with **HTTPS**.
2. Add access control (Authelia, Authentik, OAuth2 proxy, or VPN-only access) if the login page could be reached by untrusted users.
3. Set a long random `SESSION_SECRET` (for example `openssl rand -base64 32`).
4. Do not mount `/var/run/docker.sock` until you understand the risks below.

## Docker integration (v0.3.0+)

v0.3.0 adds **read-only** Docker container status when you opt in:

1. Copy [docker-compose.override.example.yml](docker-compose.override.example.yml) to `docker-compose.override.yml`.
2. Rebuild and restart the stack.
3. Enable the integration in **Settings → Integrations** and run **Test connection**.

The default Compose file still does **not** mount the Docker socket.

### Docker socket risks

- Mounting `/var/run/docker.sock` gives the UniHomelabDash process access to Docker Engine on the host.
- The socket is usually `root:docker` with mode `660`. The container runs as user `nextjs`, so the compose override must include `group_add` with your host docker GID (`DOCKER_GID` in `.env`).
- A read-only mount (`:ro`) limits some write paths but is **not** a full security boundary.
- v0.3.0 only calls read-only Docker APIs, but a compromised app could still attempt privileged operations via the socket.
- Only enable this on trusted homelab hosts where dashboard access is already restricted.
- Rotating `SESSION_SECRET` invalidates stored provider credentials (none required for local socket access in v0.3.0).

## Health checks

Health checks are **server-side HTTP GET** requests to URLs you configure. The UniHomelabDash process fetches those URLs when you tap Check or Check all.

- Only add URLs you trust the server to request.
- LAN-only hostnames must be reachable from the host or container running UniHomelabDash.
- There is no SSRF allowlist yet; restrict who can reach the dashboard.

## Reporting issues

For **security vulnerabilities**, use [GitHub Security Advisories](https://github.com/uniskela/UniHomelabDash/security/advisories/new) on the public repository. Do not open public issues for undisclosed security problems.

For other bugs, open a [GitHub issue](https://github.com/uniskela/UniHomelabDash/issues) with steps to reproduce. Do not include real homelab URLs or credentials.

## Known dependency advisories

### PostCSS (transitive via Next.js)

`npm audit` may report a moderate PostCSS advisory ([GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)) via `next@16.2.x`, which bundles `postcss@8.4.31`. This affects **build-time CSS processing only** — not the production Docker image runtime (standalone Next.js output).

A fix is available in Next.js 16.3+ preview releases. We track this until a stable Next.js patch ships with `postcss >= 8.5.10`. Do not upgrade to canary/preview solely for this advisory before v0.1.0.

### esbuild (drizzle-kit dev tooling)

Stable `drizzle-kit@0.31.x` previously pulled a vulnerable nested `esbuild` via deprecated `@esbuild-kit/*` packages. This project uses an npm `overrides` entry to force `esbuild ^0.25.12` for development tooling. The production container does not run drizzle-kit or the esbuild development server.
