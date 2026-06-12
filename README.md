# UniHomelabDash

Self-hosted homelab dashboard — save your services, check health on demand, open everything from your phone.

> **Security:** v0.1.0 has **no login**. Use on a trusted homelab network only. Do not expose to the public internet without a reverse proxy and access control (Authelia, VPN, etc.). See [SECURITY.md](SECURITY.md).

## Quick start (Docker)

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). Rebuild after pulling changes so the image includes the latest UI and PWA assets.

The Compose file mounts a named volume at `/app/data` for SQLite persistence. It intentionally does not mount `/var/run/docker.sock`.

If port 3000 is already in use:

```bash
HOST_PORT=3003 docker compose up --build
```

Copy [.env.example](.env.example) for optional environment variables (`DATABASE_PATH`, `HOST_PORT`, `ALLOWED_DEV_ORIGIN`).

## Pre-built container images

CI builds images on every push to `main` and on version tags (`v0.1.0`, etc.). See [.gitea/workflows/docker-image.yml](.gitea/workflows/docker-image.yml) and [.github/workflows/docker-image.yml](.github/workflows/docker-image.yml).

### Gitea registry (primary)

```bash
docker pull git.pike.homes/alex/unihomelabdash:latest
docker run -d --name unihomelabdash \
  -p 3000:3000 \
  -v unihomelabdash-data:/app/data \
  --restart unless-stopped \
  git.pike.homes/alex/unihomelabdash:latest
```

Pin a release: `git.pike.homes/alex/unihomelabdash:v0.1.0`

### GitHub mirrors (when Actions is configured)

```bash
docker pull ghcr.io/<owner>/unihomelabdash:latest
docker pull docker.io/<username>/unihomelabdash:latest   # optional, if Docker Hub secrets are set
```

Replace `<owner>` with your GitHub username or org (lowercase). Replace `<username>` with your Docker Hub namespace.

### Compose with a pre-built image

Use a override file or set `image` instead of `build`:

```yaml
services:
  unihomelabdash:
    image: git.pike.homes/alex/unihomelabdash:latest
```

### CI secrets

**Gitea** (`git.pike.homes`):

| Secret | Purpose |
|--------|---------|
| `REGISTRY_USERNAME` | Gitea user or bot with package write |
| `REGISTRY_TOKEN` | Gitea personal access token with package write scope |

**GitHub**:

| Secret | Required | Purpose |
|--------|----------|---------|
| `REGISTRY_USERNAME` | Optional | GitHub username for GHCR (defaults to the workflow actor) |
| `REGISTRY_TOKEN` | Optional | GitHub PAT with `write:packages` (defaults to the automatic workflow token) |
| `DOCKERHUB_USERNAME` | Optional | Docker Hub namespace |
| `DOCKERHUB_TOKEN` | Optional | Docker Hub access token |

Secret names must be alphanumeric or underscore only, and cannot start with `GITHUB_`. Use `REGISTRY_TOKEN` for a custom GHCR PAT — not `GITHUB_TOKEN`.

For the first GHCR push, set **Settings → Actions → General → Workflow permissions → Read and write permissions**.

## What it does

- Mobile-first dashboard with service cards and health status
- Manual service links with categories, hosts, icons, and notes
- On-demand HTTP health checks with last-checked timestamps
- Installable PWA (home screen / desktop shortcut)
- SQLite persistence and Docker Compose deployment

## What it does not do (yet)

- Authentication or multi-user access
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

Demo data only (`example.local` URLs). Regenerate after UI changes:

```bash
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
npm run screenshots  # capture docs/screenshots (requires build)
```

## Security

Authentication is planned for Phase 4. This build has no privileged integrations.

- Do not expose to the internet without proxy auth — see [SECURITY.md](SECURITY.md)
- Health checks perform server-side HTTP requests to URLs you configure
- Secrets must remain server-side only; do not store API tokens in service fields

## License

MIT — see [LICENSE](LICENSE).
