# AGENTS.md

## Project: UniHomelabDash

UniHomelabDash is a self-hosted Progressive Web App for managing a homelab from one clean interface.

It is not just a bookmark dashboard. It should become a unified control centre for homelab services, beginning with monitoring and safe actions for Docker/Portainer-style workloads, then expanding into Proxmox, Arr stack, Jellyfin, Immich, backups, alerts, and optional AI-assisted troubleshooting.

## Product Goal

Build a mobile-friendly PWA that lets users:

* View homelab services in one dashboard.
* Monitor health, uptime, resource usage, and alerts.
* Perform safe common actions such as restart, start, stop, redeploy, view logs, and open service UIs.
* Add integrations through a modular provider system.
* Use the app from iOS, Android, desktop, and browser.
* Keep the app self-hosted, private, and local-first.

## Core Principles

1. Ship small, polished features.
2. Prioritise safety over power.
3. Never expose secrets to the frontend.
4. Actions must require confirmation unless explicitly marked as safe.
5. Every integration should fail gracefully.
6. The UI must work well on phones first.
7. Avoid becoming another bookmark-only dashboard.
8. Prefer simple config over complex setup.
9. Use modular provider architecture from day one.
10. Keep the MVP achievable.

## Initial Platform

Start as a PWA.

Target devices:

* iPhone Safari
* Android Chrome
* Desktop Chrome/Edge/Firefox
* Tablet browsers

Native apps can come later through Capacitor or React Native if the PWA proves useful.

## Suggested Tech Stack

Use a modern TypeScript-first stack.

Recommended:

* Next.js or Vite + React
* TypeScript
* Tailwind CSS
* shadcn/ui or similar component system
* Zustand or TanStack Query for client state/data fetching
* Node.js backend API layer
* SQLite for local app data
* Drizzle ORM or Prisma
* Docker Compose for deployment
* PWA manifest + service worker

Do not over-engineer the first version.

## Architecture

Use a split architecture:

* Frontend PWA
* Backend API
* Provider/integration layer
* Local database
* Background worker/jobs system

Suggested folders (future monorepo option):

```txt
/apps/web
/apps/api
/packages/shared
/packages/providers
/packages/ui
/docs
```

**Current repo layout:** a single Next.js app at the repository root with API routes, `src/`, and `docs/`. A monorepo split can come later if the project outgrows one app.

## Provider System

Each integration should follow a common provider contract.

Example provider capabilities:

```ts
type ProviderCapability =
  | "service.status"
  | "service.logs"
  | "service.restart"
  | "service.start"
  | "service.stop"
  | "service.open"
  | "resource.cpu"
  | "resource.memory"
  | "resource.storage"
  | "alerts.read";
```

Each provider should define:

* Name
* Icon
* Required credentials
* Supported actions
* Connection test method
* Read methods
* Action methods
* Permission/safety metadata

## MVP Integrations

### Shipped (v0.1.0)

1. Manual services/bookmarks with on-demand HTTP health checks

### Planned (not in v0.1.0)

2. Docker container status via a controlled API proxy (not raw socket access without auth)
3. Portainer integration if practical

Do not start with Proxmox, Arr stack, Jellyfin, Immich, Home Assistant, Kubernetes, or AI until the base app is usable and authenticated where needed.

## MVP Features

### Shipped in v0.1.0

* Installable PWA
* Dashboard grid with service cards
* On-demand service health checks (manual Check / Check all)
* Manual service links (add, edit, delete)
* Dark mode
* Mobile-first layout
* Basic settings screen
* Local SQLite database
* Docker Compose deployment (no Docker socket mount)
* README with screenshots

### Planned (future phases)

* Docker/Portainer container list and read-only status
* Container start/stop/restart actions with confirmation modals
* Basic logs viewer
* Authentication and session management
* Background health polling and alerts

## Safety Rules

Actions must be safe by default.

Required:

* Confirmation before destructive or disruptive actions.
* Display exactly what will happen before an action runs.
* Never store API tokens in frontend localStorage.
* Use backend-only encrypted credential storage where possible.
* Redact secrets from logs.
* Show clear errors when credentials fail.
* Prefer read-only mode when adding a new integration.
* Allow users to disable actions per provider.

Do not allow:

* Raw shell execution in MVP.
* Arbitrary command execution.
* Automatic destructive fixes.
* Public internet exposure without authentication warnings.
* Hardcoded secrets.
* Blind retries of dangerous actions.

## Authentication

Shipped in v0.2.0:

* Single admin user with first-run `/setup`
* Password-based login at `/login`
* Signed HTTP-only session cookie
* Middleware protection for all dashboard routes
* `SESSION_SECRET` required in production; `COOKIE_SECURE=true` when behind HTTPS

Later:

* OIDC
* Authelia/AuthentiK integration
* Multi-user roles
* API keys

## UI Direction

Style should feel:

* Clean
* Dark-mode friendly
* Modern
* Calm
* Technical but not overwhelming
* Useful on a phone

Avoid:

* Cluttered enterprise dashboards
* Too many graphs at once
* Tiny buttons
* Actions hidden behind unclear icons

Main navigation (v0.1.0):

* Dashboard
* Services
* Settings

Future navigation may add Actions and Alerts when those features ship.

## Dashboard Card Ideas

Each service card may show:

* Name
* Icon
* Status
* Host
* Category
* Quick actions
* Last checked time
* Resource snapshot
* Open button

Example actions:

* Open
* Restart
* View logs
* More

## Development Rules

When modifying this project (contributors and automation alike):

1. Read AGENTS.md and ROADMAP.md first.
2. Keep changes small and reviewable.
3. Do not introduce large dependencies without explaining why.
4. Prefer typed interfaces.
5. Add clear TODO comments where features are stubbed.
6. Do not fake integrations as complete.
7. Keep MVP scope tight.
8. Write code that is easy for a solo maintainer to understand.
9. Update ROADMAP.md when features are completed or changed.
10. Add documentation for setup/config changes.

Human contributors should also read [CONTRIBUTING.md](CONTRIBUTING.md).

## AI-assisted development

AI coding tools are welcome if they follow the same rules as human contributors. Before making changes, read AGENTS.md, ROADMAP.md, and ARCHITECTURE.md. Keep diffs small, do not expand scope without an issue or ROADMAP update, and never commit secrets. When handing work between people and tools, leave a short note: goal, files touched, what works, what is broken, and what to do next.

If guidance conflicts:

1. AGENTS.md wins for project rules.
2. ARCHITECTURE.md wins for infrastructure decisions.
3. ROADMAP.md wins for feature scope.
4. README.md should reflect the current runnable state.

## Scope boundaries

Do not implement the following unless explicitly requested in an issue or ROADMAP update:

* Proxmox
* Docker socket access
* Portainer actions
* Arr stack
* Jellyfin
* Immich
* AI assistant
* Notifications
* Native mobile apps

## Definition of Done

A feature is done when:

* It works locally.
* It has basic error handling.
* It works on mobile layout.
* It does not expose secrets.
* It has clear user-facing labels.
* It is documented if setup/config is required.
* It does not break existing providers.

## Current Priority

v0.2.0 shipped: manual-services PWA with on-demand health checks, SQLite persistence, Docker Compose deployment, and single-admin authentication.

Next focus (see ROADMAP.md):

* Provider system foundation for future integrations
* Docker/Portainer read-only status only when explicitly scoped and behind auth

Do not chase every homelab integration at once.
