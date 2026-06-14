# Contributing to UniHomelabDash

Thank you for your interest in UniHomelabDash.

This project is a **self-hosted, mobile-first homelab dashboard** — simple first, with room to grow into a real control plane for Docker, Portainer, Proxmox, and more over time. v0.1.0 focuses on manual services and on-demand health checks. We want contributions that stay useful on a phone, safe by default, and easy to self-host.

**Public repository:** https://github.com/uniskela/UniHomelabDash

## Before you start

Read these in order:

1. [ROADMAP.md](ROADMAP.md) — what is shipped, in progress, and planned
2. [ARCHITECTURE.md](ARCHITECTURE.md) — technical direction and security model
3. [AGENTS.md](AGENTS.md) — project principles, scope boundaries, and rules for humans and AI-assisted work

If your change touches deployment or security behaviour, also read [SECURITY.md](SECURITY.md).

## Development setup

### Node.js (recommended for UI work)

```bash
git clone https://github.com/uniskela/UniHomelabDash.git
cd UniHomelabDash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). SQLite data is stored at `data/unihomelabdash.sqlite` by default.

### Docker Compose

```bash
docker compose up --build
```

See [README.md](README.md) for port overrides, environment variables, and LAN/phone testing (`npm run dev:lan`).

## Choosing work

* Check [ROADMAP.md](ROADMAP.md) for phases marked **In Progress** or **Planned** before starting large features.
* Open an issue to discuss non-trivial changes, especially new integrations or security-sensitive behaviour.
* Respect **scope boundaries** in [AGENTS.md](AGENTS.md) — do not add Proxmox, Docker socket access, Portainer actions, or similar without an agreed issue/ROADMAP entry.
* Small fixes, docs improvements, and polish aligned with the current phase are always welcome.

## Coding expectations

* **TypeScript** with clear types; prefer extending existing patterns over new abstractions.
* **Small, reviewable PRs** — one logical change per pull request when possible.
* **Mobile-first UI** — test at phone widths; avoid tiny controls and cluttered layouts.
* **No secrets in the frontend** — credentials and tokens stay server-side only.
* **Honest integrations** — do not mark providers or features complete when they are stubbed; use TODOs where appropriate.
* **Update docs** when setup, config, or user-visible behaviour changes (README, ROADMAP, or ARCHITECTURE as relevant).

## Before opening a PR

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

If you changed UI, do a quick manual check in the browser at a mobile viewport.

For screenshot updates after UI changes:

```bash
npm run build
npm run screenshots
```

## Security

v0.2.0 requires **single-admin login** for dashboard access. Set `SESSION_SECRET` in production and complete first-run setup at `/setup`.

* Read [SECURITY.md](SECURITY.md) before deploying or changing server-side fetch behaviour.
* Do not commit `.env`, credentials, or real homelab URLs in issues or PRs.
* Do not store API tokens in service notes or frontend code.
* Do not mount `/var/run/docker.sock` or add privileged integrations without authentication and explicit ROADMAP scope.

Report vulnerabilities via [GitHub Security Advisories](https://github.com/uniskela/UniHomelabDash/security/advisories/new) (see SECURITY.md).

## Proposing integrations

New homelab integrations should be discussed in an issue before substantial implementation.

Include:

* Which service (Docker, Portainer, Proxmox, etc.)
* Read-only vs actions, and what confirmation/safety you propose
* How credentials would be stored (server-side only)
* Whether the integration fits the provider contract described in [ARCHITECTURE.md](ARCHITECTURE.md) and [AGENTS.md](AGENTS.md)

Prefer read-only status first. Destructive or disruptive actions require confirmation UI and should not ship without authentication.

## Release checklist (maintainers)

Before announcing a release:

1. Create and push a Git tag `vX.Y.Z` on GitHub (triggers GHCR and Docker Hub builds when secrets are configured).
2. Confirm the [GitHub Actions docker workflow](.github/workflows/docker-image.yml) succeeded.
3. In GitHub **Packages** → `unihomelabdash` → **Package settings**, connect the package to `uniskela/UniHomelabDash` and verify OCI labels (title, source, license) appear on GHCR.
4. Verify pulls work (GHCR and [Docker Hub](https://hub.docker.com/r/uniskela/unihomelabdash)):
   - `docker pull ghcr.io/uniskela/unihomelabdash:vX.Y.Z`
   - `docker pull ghcr.io/uniskela/unihomelabdash:X.Y.Z`
   - `docker pull uniskela/unihomelabdash:vX.Y.Z`
   - `docker pull uniskela/unihomelabdash:X.Y.Z`
5. Confirm [README.md](README.md) **Container Images** pull commands and tag table are still accurate.
6. Include image pull examples in GitHub release notes.

### Internal infrastructure (maintainers only)

If you push release tags to the maintainer’s **private** Gitea instance (LAN/Tailscale only, not a public resource):

1. Push the same `vX.Y.Z` tag to the internal remote when on the maintainer network.
2. Confirm [.gitea/workflows/docker-image.yml](.gitea/workflows/docker-image.yml) succeeded.
3. Verify internal registry tags (`git.pike.homes/alex/unihomelabdash`) match the GHCR release.

Do not mention internal hostnames in public release notes or contributor-facing issues.

## Questions

Open a [GitHub issue](https://github.com/uniskela/UniHomelabDash/issues) for bugs, feature ideas, or integration proposals.
