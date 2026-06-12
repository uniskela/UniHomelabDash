# UniHomelabDash

UniHomelabDash is a self-hosted PWA homelab dashboard. Add your services, open them quickly from your phone, and run on-demand health checks — without exposing Docker sockets or other privileged integrations.

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

Regenerate after UI changes:

```bash
npm run build
npm run screenshots
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Manual services are stored in SQLite at `data/unihomelabdash.sqlite` by default. Set `DATABASE_PATH` to use a different location.

### LAN / phone testing (dev)

To test from another device on your network:

```bash
npm run dev:lan
```

Then open `http://<your-host-ip>:3004` (find your IP with `hostname -I` or `ip a`).

Next.js blocks cross-origin dev assets by default. This project configures `allowedDevOrigins` in `next.config.ts` for common private LAN ranges. If you still see `webpack-hmr` WebSocket errors, set a specific host:

```bash
ALLOWED_DEV_ORIGIN=192.168.0.7 npm run dev:lan
```

See the [Next.js allowedDevOrigins docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins).

For the closest experience to production (no HMR, matches Docker deploy):

```bash
docker compose up --build
# or
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

## Docker Compose

```bash
docker compose up --build
```

Rebuild after pulling changes so the image includes the latest UI and PWA assets:

```bash
docker compose up --build
```

The Compose file mounts a named volume at `/app/data` for SQLite persistence. It intentionally does not mount `/var/run/docker.sock`.

If port 3000 is already in use:

```bash
HOST_PORT=3003 docker compose up --build
```

## Health checks

When adding or editing a service, set an optional **health check URL**. Use the service root or a dedicated endpoint (for example `/health`). Tap **Check** on a card or **Check all** on the dashboard.

The UniHomelabDash server must be able to reach the URL. LAN-only hostnames work when the app runs on the same network.

## Security Notes

Authentication is planned for a future release. This build has no privileged integrations. Do not add Docker, Portainer, Proxmox, or other privileged actions before authentication exists.

Secrets must remain server-side only. Manual services should not store credentials or API tokens.

## License

MIT — see [LICENSE](LICENSE).
