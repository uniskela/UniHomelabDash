<p align="center">
  <img src="docs/branding/logo-wordmark-stacked.svg" alt="UniHomelabDash" width="280" />
</p>

# UniHomelabDash

Self-hosted homelab control plane — save your services, check health on demand, open everything from your phone.

Brand assets and palette: [docs/branding/BRAND.md](docs/branding/BRAND.md)

> **Security:** Authentication is required for dashboard access. On first run, create the admin account at `/setup`. Set `SESSION_SECRET` in production. Do not expose to the public internet without HTTPS and access control. See [SECURITY.md](SECURITY.md).

## Quick start (Docker)

Create a `.env` file with a strong `SESSION_SECRET` (see [.env.example](.env.example)), then start the stack:

```bash
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). On first visit you will be prompted to create an admin account at `/setup`.

The Compose file mounts a named volume at `/app/data` for SQLite persistence. It intentionally does not mount `/var/run/docker.sock`.

If port 3000 is already in use:

```bash
HOST_PORT=3003 docker compose up --build
```

### Upgrading from v0.1.0

1. Add `SESSION_SECRET` to your `.env` (see [.env.example](.env.example)).
2. Rebuild and restart: `docker compose up --build -d`.
3. On first visit, complete `/setup` to create the admin account (existing services data in the SQLite volume is preserved).
4. If you serve over HTTPS via a reverse proxy, set `COOKIE_SECURE=true` and `PUBLIC_URL` to your public origin (see [.env.example](.env.example)).

Copy [.env.example](.env.example) for environment variables. **`SESSION_SECRET` is required** in production containers. Optional settings include `DATABASE_PATH`, `HOST_PORT`, `COOKIE_SECURE`, `PUBLIC_URL`, `TRUST_PROXY_HEADERS`, `ALLOWED_HOSTS`, and `ALLOWED_DEV_ORIGIN`.

## Container Images

**Production image installs require `SESSION_SECRET`.** Generate one before `docker run` or add it to a `.env` file for Compose (see [Quick start](#quick-start-docker)).

Public source code and releases: [github.com/uniskela/UniHomelabDash](https://github.com/uniskela/UniHomelabDash).

CI builds OCI images on every push to `main` and on version tags (`v0.1.0`, etc.) via [.github/workflows/docker-image.yml](.github/workflows/docker-image.yml) (GHCR and [Docker Hub](https://hub.docker.com/r/uniskela/unihomelabdash)) and [.github/workflows/ci.yml](.github/workflows/ci.yml) (app CI).

### Registries

| Registry | Image | Notes |
|----------|-------|--------|
| **GHCR** | `ghcr.io/uniskela/unihomelabdash` | Built by GitHub Actions |
| **Docker Hub** | `uniskela/unihomelabdash` | [hub.docker.com/r/uniskela/unihomelabdash](https://hub.docker.com/r/uniskela/unihomelabdash) — same tags as GHCR |

Either registry works for installs. Use whichever is easier on your network.

### Tags

The same tags are published to GHCR and Docker Hub:

| Tag | When published | GHCR | Docker Hub |
|-----|----------------|------|------------|
| `latest` | Every push to `main`; also updated on release tags | `ghcr.io/uniskela/unihomelabdash:latest` | `uniskela/unihomelabdash:latest` |
| `vX.Y.Z` | Git tag `vX.Y.Z` | `ghcr.io/uniskela/unihomelabdash:v0.1.0` | `uniskela/unihomelabdash:v0.1.0` |
| `X.Y.Z` | Same release (semver without `v` prefix) | `ghcr.io/uniskela/unihomelabdash:0.1.0` | `uniskela/unihomelabdash:0.1.0` |

Pin a release with either `v0.1.0` or `0.1.0` — both point at the same image.

### docker run

GHCR:

```bash
docker pull ghcr.io/uniskela/unihomelabdash:latest
docker run -d --name unihomelabdash \
  -p 3000:3000 \
  -e SESSION_SECRET="$(openssl rand -base64 32)" \
  -v unihomelabdash-data:/app/data \
  --restart unless-stopped \
  ghcr.io/uniskela/unihomelabdash:latest
```

For a fixed secret across restarts, use `--env-file .env` instead of `-e SESSION_SECRET=...` (see [.env.example](.env.example)).

Docker Hub:

```bash
docker pull uniskela/unihomelabdash:latest
docker run -d --name unihomelabdash \
  -p 3000:3000 \
  -e SESSION_SECRET="$(openssl rand -base64 32)" \
  -v unihomelabdash-data:/app/data \
  --restart unless-stopped \
  uniskela/unihomelabdash:latest
```

### docker-compose (pre-built image)

Use `image` instead of `build` (for example in `docker-compose.override.yml`). Create a `.env` file with `SESSION_SECRET` first (see [Quick start](#quick-start-docker)):

```yaml
services:
  unihomelabdash:
    image: ghcr.io/uniskela/unihomelabdash:latest
    # image: uniskela/unihomelabdash:latest  # Docker Hub
    container_name: unihomelabdash
    ports:
      - "${HOST_PORT:-3000}:3000"
    environment:
      DATABASE_PATH: /app/data/unihomelabdash.sqlite
      SESSION_SECRET: ${SESSION_SECRET:?Set SESSION_SECRET in a .env file or shell environment}
      COOKIE_SECURE: ${COOKIE_SECURE:-false}
      PUBLIC_URL: ${PUBLIC_URL:-}
      TRUST_PROXY_HEADERS: ${TRUST_PROXY_HEADERS:-false}
      ALLOWED_HOSTS: ${ALLOWED_HOSTS:-}
    volumes:
      - unihomelabdash-data:/app/data
    restart: unless-stopped

volumes:
  unihomelabdash-data:
```

### CI secrets (GitHub)

| Secret | Required | Purpose |
|--------|----------|---------|
| `REGISTRY_USERNAME` | Optional | GitHub username for GHCR (defaults to the workflow actor) |
| `REGISTRY_TOKEN` | Optional | GitHub PAT with `write:packages` (defaults to the automatic workflow token) |
| `DOCKERHUB_USERNAME` | For Docker Hub push | Docker Hub namespace (`uniskela`) |
| `DOCKERHUB_TOKEN` | For Docker Hub push | Docker Hub access token |

Secret names must be alphanumeric or underscore only, and cannot start with `GITHUB_`. Use `REGISTRY_TOKEN` for a custom GHCR PAT — not `GITHUB_TOKEN`.

For the first GHCR push, set **Settings → Actions → General → Workflow permissions → Read and write permissions**.

### Maintainer-only: internal infrastructure

The project maintainer may also build images to a **private** self-hosted Gitea registry on an internal network (LAN/Tailscale only). This is **not** a public distribution channel — contributors and users should use GitHub, GHCR, or Docker Hub only.

- Workflow: [.gitea/workflows/docker-image.yml](.gitea/workflows/docker-image.yml)
- Internal registry image: `git.pike.homes/alex/unihomelabdash` (reachable only on maintainer network)
- Secrets: `REGISTRY_USERNAME`, `REGISTRY_TOKEN` (Gitea package write)

Do not document or share internal hostnames in issues, PRs, or release notes intended for the public.

## What it does

- Mobile-first dashboard with service cards and health status
- Manual service links with categories, hosts, icons, and notes
- On-demand HTTP health checks with last-checked timestamps
- Installable PWA (home screen / desktop shortcut)
- SQLite persistence and Docker Compose deployment
- Single-admin authentication with first-run setup and session cookies

## What it does not do (yet)

- Multi-user access or OIDC
- Docker, Portainer, or Proxmox integrations
- Push notifications or alerts
- Automatic background health polling

## Screenshots

| Dashboard | Services |
|-----------|----------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Services](docs/screenshots/services.png) |

| Add service form |
|------------------|
| ![Add service](docs/screenshots/add-service.png) |

Demo data only (`example.local` URLs). Regenerate after UI or branding changes:

```bash
npm run icons:export   # when brand SVG assets change
npm run build
npm run screenshots
```

## Health checks

When adding or editing a service, set an optional **health check URL**. Use the service root or a dedicated endpoint (for example `/health`). Tap **Check** on a card or **Check all** on the dashboard.

Behaviour in v0.1.0:

- **GET** requests only, **5 second** timeout
- HTTP **2xx–3xx** responses count as healthy; other codes show as degraded with the status message
- Checks run **on demand** when you tap Check — there is no background polling
- The UniHomelabDash server must be able to reach the URL from the host or container
- LAN-only hostnames work when the app runs on the same network

Edit and delete services from the **Services** page (overflow menu on each card). The dashboard is for quick open and health overview.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Manual services are stored in SQLite at `data/unihomelabdash.sqlite` by default. Set `DATABASE_PATH` to use a different location.

### LAN / phone testing (dev)

```bash
npm run dev:lan
```

Then open `http://<your-host-ip>:3004` (find your IP with `hostname -I` or `ip a`).

Next.js blocks cross-origin dev assets by default. This project configures `allowedDevOrigins` in `next.config.ts` for common private LAN ranges. If you still see `webpack-hmr` WebSocket errors:

```bash
ALLOWED_DEV_ORIGIN=192.168.0.7 npm run dev:lan
```

See the [Next.js allowedDevOrigins docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins).

For production-like testing without HMR:

```bash
npm run build && npm run start:lan
```

## Scripts

```bash
npm run dev          # local development (port 3000)
npm run dev:lan      # dev server on 0.0.0.0:3004 for LAN testing
npm run lint
npm run typecheck
npm run build
npm run start:lan    # production server on 0.0.0.0:3004
npm run db:generate
npm run db:migrate
npm run test
npm run screenshots  # capture docs/screenshots (requires build)
```

## Security

Authentication is required before dashboard access. Privileged integrations are not enabled yet.

- Set `SESSION_SECRET` in production — see [SECURITY.md](SECURITY.md)
- Do not expose to the internet without HTTPS and proxy access control
- Health checks perform server-side HTTP requests to URLs you configure
- Secrets must remain server-side only; do not store API tokens in service fields

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) for setup, PR expectations, and scope rules.

- [ROADMAP.md](ROADMAP.md) and [ARCHITECTURE.md](ARCHITECTURE.md) explain project direction and technical decisions
- [AGENTS.md](AGENTS.md) holds principles, safety rules, and guidance for contributors and AI-assisted work
- Report security issues via [SECURITY.md](SECURITY.md) and [GitHub Security Advisories](https://github.com/uniskela/UniHomelabDash/security/advisories/new)

## License

MIT — see [LICENSE](LICENSE).
