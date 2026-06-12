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

Suggested folders:

```txt
/apps/web
/apps/api
/packages/shared
/packages/providers
/packages/ui
/docs
```

For a simpler MVP, a single Next.js app with API routes is acceptable.

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

Start with only:

1. Manual services/bookmarks
2. Docker container status via Docker socket or API proxy
3. Portainer integration if practical

Do not start with Proxmox, Arr stack, Jellyfin, Immich, Home Assistant, Kubernetes, or AI until the base app is usable.

## MVP Features

The first public MVP should include:

* Installable PWA
* Dashboard grid/list
* Service cards
* Service health status
* Manual service links
* Docker/Portainer container list
* Container start/stop/restart actions
* Confirmation modal for actions
* Basic logs viewer
* Dark mode
* Mobile-first layout
* Basic settings screen
* Local SQLite database
* Docker Compose deployment
* README with screenshots

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

For MVP, keep auth simple but do not skip it.

Acceptable options:

* Single admin user
* Password-based login
* Session cookie
* Optional reverse-proxy auth compatibility

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

Main navigation:

* Dashboard
* Services
* Actions
* Alerts
* Settings

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

## Development Rules for Codex

When modifying this project:

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

## Codex and Cursor Workflow

This project may be worked on using both Cursor and Codex CLI.

### Cursor Role

Cursor should be treated as the main development environment and UI/UX iteration tool.

Use Cursor for:

* Visual UI/UX refinement.
* Component layout.
* Mobile responsiveness.
* Design polish.
* Copy and microcopy improvements.
* Refactoring React components.
* Reviewing how the app feels to use.
* Small interactive improvements.
* Developer-guided edits.

Cursor should prioritise:

* Mobile-first usability.
* Clean dashboard layout.
* Simple navigation.
* Accessible controls.
* Clear empty states.
* Consistent spacing.
* Avoiding clutter.

### Codex CLI Role

Codex CLI should be treated as the structured implementation and review agent.

Use Codex CLI for:

* Scaffolding features from ROADMAP.md.
* Implementing database/schema changes.
* Adding backend/API/provider logic.
* Running tests, linting, type checks, and builds.
* Reviewing code for errors.
* Updating documentation.
* Performing focused implementation tasks.

Codex CLI should prioritise:

* Correctness.
* Type safety.
* Small reviewable changes.
* Security boundaries.
* Documentation updates.
* Keeping scope aligned with AGENTS.md, ROADMAP.md, and ARCHITECTURE.md.

### Handover Rules

Before handing work from Cursor to Codex CLI, create a short task note containing:

* Current goal.
* Files changed.
* What is working.
* What is broken or unfinished.
* What Codex should do next.
* What Codex must not touch.

Before handing work from Codex CLI to Cursor, Codex should provide:

* Summary of changes.
* Commands run.
* Known issues.
* UI areas needing polish.
* Files/components most relevant for Cursor to inspect.

### Conflict Rules

If Cursor and Codex disagree:

1. AGENTS.md wins for project rules.
2. ARCHITECTURE.md wins for infrastructure decisions.
3. ROADMAP.md wins for feature scope.
4. README.md should reflect the current runnable state.
5. Do not add major features just because one agent suggests them.

### Scope Control

Neither Cursor nor Codex should implement future integrations unless explicitly requested.

Do not implement yet:

* Proxmox
* Docker socket access
* Portainer actions
* Arr stack
* Jellyfin
* Immich
* AI assistant
* Notifications
* Native mobile apps

The current priority is a polished PWA MVP with manual services.


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

Build the first working PWA shell with manual services and a clean provider system foundation.

Do not chase every homelab integration yet.
