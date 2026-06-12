# Security

UniHomelabDash v0.1.0 is a **manual-services dashboard** without login. Read this before deploying.

## Supported use

- Self-hosted on a **trusted homelab network** (LAN or VPN)
- Single-operator or small household where everyone on the network is trusted
- Docker Compose with the default setup (no Docker socket mount)

## Unsupported use

- **Public internet exposure** without authentication in front of the app
- Multi-tenant or shared hosting where untrusted users can reach the UI
- Storing API tokens, passwords, or secrets in service notes (not designed for secrets)

Anyone who can open the dashboard can add, edit, delete services and trigger health checks.

## Before exposing beyond your LAN

1. Put UniHomelabDash behind a reverse proxy (nginx, Caddy, Traefik).
2. Add access control (Authelia, Authentik, OAuth2 proxy, or VPN-only access).
3. Prefer **HTTPS** for PWA install and service worker behaviour on mobile devices.
4. Do not mount `/var/run/docker.sock` until authentication and action safety ship.

## Health checks

Health checks are **server-side HTTP GET** requests to URLs you configure. The UniHomelabDash process fetches those URLs when you tap Check or Check all.

- Only add URLs you trust the server to request.
- LAN-only hostnames must be reachable from the host or container running UniHomelabDash.
- There is no SSRF allowlist in v0.1.0; untrusted users should not have dashboard access.

## Reporting issues

Open an issue in the project repository with steps to reproduce. Do not include real homelab URLs or credentials.
