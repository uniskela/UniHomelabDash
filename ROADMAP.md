# ROADMAP.md

# UniHomelabDash Roadmap

UniHomelabDash is a self-hosted PWA for managing and operating a homelab from one interface.

The long-term vision is a unified homelab control centre: dashboard, monitoring, actions, alerts, logs, automation, and eventually AI-assisted troubleshooting.

The short-term goal is much smaller: ship a polished PWA MVP that is genuinely useful without becoming too complex.

---

## Phase 0 — Project Foundation

Status: Completed

Goals:

* Create repository structure.
* Add README.
* Add AGENTS.md.
* Add ROADMAP.md.
* Choose tech stack.
* Create Docker Compose dev setup.
* Add licence.
* Add basic contribution notes.

Completed for v0.1.0:

* README, LICENSE (MIT), Docker Compose, `.env.example`, SECURITY.md
* Contribution notes still optional (see nice-to-have)

Recommended licence:

* AGPLv3 if the project should remain open when hosted as a service.
* MIT if maximum adoption is preferred.

Initial decision: use MIT unless there is a strong reason to protect future hosted versions.

---

## Phase 0.5 — Architecture Decision

Status: Completed

Goal: Confirm the technical direction before scaffolding application code.

Features:

* Create ARCHITECTURE.md.
* Confirm stack before scaffolding code.
* Confirm security model for privileged integrations.

Success criteria:

* The MVP stack recommendation is documented.
* The security model for Docker and other privileged integrations is documented.
* Future implementation work can follow a clear architecture decision.

---
## Phase 0.6 — Development Workflow

Status: Completed

Goal: Define a consistent workflow for human contributors and automation tools.

Decisions:

* [CONTRIBUTING.md](CONTRIBUTING.md) is the entry point for human contributors.
* [AGENTS.md](AGENTS.md) holds shared rules for contributors and AI-assisted development.
* AGENTS.md, ROADMAP.md, and ARCHITECTURE.md are the source of truth for scope and design.
* Changes stay small and reviewable; handoffs (human or tool) include goal, files touched, status, and next steps.

Success criteria:

* New contributors can onboard without private maintainer context.
* UI polish and backend work stay aligned on ROADMAP scope.
* The project remains understandable for a solo maintainer.

---

## Phase 1 — PWA Shell

Status: Completed

Goal: Create the first installable app shell.

Features:

* Responsive layout.
* Dark mode.
* App sidebar/bottom navigation.
* Dashboard page.
* Services page.
* Alerts page.
* Settings page.
* PWA manifest.
* App icons.
* Basic offline fallback.
* Mobile-first design.

Success criteria:

* App can be installed on iOS/Android/desktop.
* Navigation works well on phone screen sizes.
* Layout feels clean and not cluttered.
* No real integrations required yet.

---

## Phase 2 — Manual Services

Status: Completed

Goal: Make UniHomelabDash useful even before API integrations.

Features:

* Add/edit/delete manual services.
* Service name.
* Service URL.
* Icon.
* Category.
* Host/device.
* Notes.
* Health check URL.
* Open service button.
* Status display.
* Last checked timestamp.

Optional:

* Import/export config as JSON.
* Basic YAML config support later.

Success criteria:

* User can replace a basic bookmark dashboard.
* Service cards look good.
* Status checks work.
* Broken services show useful errors.

---

## Phase 2.5 — Product Polish Sprint

Status: Completed

Goal: Polish the manual-services experience before adding privileged integrations.

Completed:

* Use the existing health check URL field for on-demand HTTP checks.
* Store health status and last checked timestamp.
* Show Healthy, Degraded, and Unknown status badges on service cards.
* Add dashboard health summary counts.
* Create a shared ServiceCard component for Dashboard and Services.
* Improve primary screen copy to focus on managing services.
* Add 192x192, 512x512, maskable, Apple touch, and favicon PWA icons (see `docs/branding/`).
* Brand identity: charcoal/ruby/burgundy palette, Control Rail icon, wordmark SVGs, GitHub avatar concepts.
* Add simple installation instructions in Settings.
* v0.1.0 release polish: attention-first dashboard sort, LAN dev HMR fix, nav IA (Alerts demoted), SECURITY.md, demo screenshots, exposure warnings.

Out of scope:

* Authentication.
* Docker socket access.
* Provider integrations.
* Background workers.
* Notifications.
* AI features.

Success criteria:

* Users can manually check service health.
* Cards behave consistently across Dashboard and Services.
* The app feels useful as a service dashboard before becoming a control plane.

---

## Phase 3 — Local Database and Settings

Status: In Progress

Goal: Store app configuration properly.

Completed:

* SQLite database with services table.
* Runtime schema bootstrap and column migrations in [src/lib/db/client.ts](src/lib/db/client.ts).
* Docker volume persistence for `/app/data`.
* User-facing Settings with Advanced section for operators.

Remaining:

* Providers table.
* Credentials/secrets metadata.
* Settings table.
* Formal migration system (Drizzle migrations).
* Backup/export option.

Success criteria:

* App state persists reliably. (met for services)
* Config survives container restarts. (met via Compose volume)
* Secrets are not exposed to frontend code. (met; no secrets storage yet)

---

## Phase 4 — Authentication

Status: Planned

Goal: Add basic protection before action-based integrations.

Features:

* Single admin account.
* Password login.
* Secure session cookie.
* Logout.
* First-run setup screen.
* Warning if app is exposed without HTTPS/reverse proxy.

Future:

* OIDC.
* Authelia/AuthentiK support.
* Role-based access.
* Read-only users.

Success criteria:

* No unauthenticated access to the dashboard.
* Actions cannot be triggered without login.
* Setup remains simple.

---

## Phase 5 — Provider System

Status: Planned

Goal: Build the foundation for integrations.

Provider contract should support:

* Connection test
* Read-only data fetch
* Available actions
* Action execution
* Safety metadata
* Credential requirements
* Error handling

Initial provider types:

* Manual provider
* Docker provider
* Portainer provider

Success criteria:

* Providers can be added without rewriting the dashboard.
* UI can discover provider capabilities.
* Unsupported actions are hidden or disabled.
* Failed providers do not crash the app.

---

## Phase 6 — Docker Integration

Status: Planned

Goal: Show and control Docker containers.

Features:

* List containers.
* Container status.
* Image name.
* Uptime/created time.
* Ports.
* Basic resource usage if available.
* Start container.
* Stop container.
* Restart container.
* View recent logs.

Safety:

* Require confirmation for start/stop/restart.
* Show affected container name.
* Redact secrets from logs where possible.
* Do not allow arbitrary shell commands.

Success criteria:

* User can see containers from UniHomelabDash.
* User can safely restart a container from mobile.
* Logs viewer is useful for quick checks.

---

## Phase 7 — Portainer Integration

Status: Planned

Goal: Support users who manage homelabs through Portainer.

Features:

* Connect to Portainer API.
* List endpoints.
* List stacks.
* List containers.
* View stack status.
* Restart container.
* Redeploy stack if safe/practical.
* View logs where supported.

Success criteria:

* User can manage common Portainer tasks without opening Portainer.
* Integration handles API failures gracefully.
* Actions are clearly labelled and confirmed.

---

## Phase 8 — Alerts and Activity Feed

Status: Planned

Goal: Give the user a useful summary of what needs attention.

Features:

* Alerts page.
* Activity feed.
* Service down alert.
* Provider connection failure.
* Failed action log.
* Recent restarts/stops.
* Basic severity levels.

Future:

* Discord notifications.
* Email notifications.
* Push notifications.
* Webhooks.

Success criteria:

* User can quickly see what changed.
* Failed checks are visible.
* Actions are auditable.

---

## Phase 9 — Proxmox Integration

Status: Future

Goal: Add safe Proxmox visibility and actions.

Features:

* Connect to Proxmox API.
* List nodes.
* List VMs.
* List LXCs.
* Status.
* CPU/RAM/disk summary.
* Start/stop/reboot VM/LXC.
* Snapshot creation.
* View recent tasks.

Safety:

* Dangerous actions require confirmation.
* Snapshot/restore must be clearly explained.
* No destructive deletes in early versions.

Success criteria:

* User can check and restart common Proxmox workloads from mobile.
* The app does not encourage risky operations.

---

## Phase 10 — Arr Stack Integration

Status: Future

Goal: Add useful media-server operations.

Supported apps:

* Sonarr
* Radarr
* Prowlarr
* Lidarr later

Features:

* Queue overview.
* Failed downloads.
* Wanted/missing items.
* Search trigger.
* Retry failed imports.
* Calendar summary.
* Health warnings.

Success criteria:

* User can resolve common Arr issues quickly.
* No overwhelming media-management UI duplication.

---

## Phase 11 — Media and Photo Integrations

Status: Future

Potential integrations:

* Jellyfin
* Plex
* Immich
* Audiobookshelf
* Navidrome

Possible features:

* Active streams.
* Library scan status.
* Trigger scan.
* Storage usage.
* Immich upload/ML job visibility.
* Server health.

Success criteria:

* App gives useful operational control without replacing native apps.

---

## Phase 12 — Notifications

Status: Future

Features:

* Discord webhook notifications.
* PWA push notifications.
* Alert rules.
* Quiet hours.
* Per-service notification settings.

Example notifications:

* Service down.
* Container restarted.
* Proxmox VM stopped.
* Disk usage high.
* Backup failed.

Success criteria:

* Notifications are useful, not spammy.
* User can tune alert noise.

---

## Phase 13 — AI Assistant Layer

Status: Future

Goal: Add optional AI-assisted troubleshooting.

Features:

* Summarise logs.
* Explain alerts.
* Suggest next steps.
* Identify likely root cause.
* Generate customer-friendly explanations.
* Optional local LLM support later.

Rules:

* AI must not run actions automatically in early versions.
* AI suggestions must be clearly labelled as suggestions.
* Never send secrets to external AI providers.
* Redact sensitive data before analysis.

Example prompts:

* “Why is my server slow?”
* “What changed in the last 24 hours?”
* “Why did this container restart?”
* “Summarise these logs.”

Success criteria:

* AI helps users understand problems.
* It does not become unsafe automation.

---

## Phase 14 — Automation Rules

Status: Future

Goal: Allow simple if-this-then-that style homelab automation.

Examples:

* If container is unhealthy for 5 minutes, notify Discord.
* If disk usage exceeds 90%, create alert.
* If backup fails, send push notification.
* If service is down, retry health check before alerting.

Do not add automatic restarts until safety model is mature.

---

## Long-Term Vision

UniHomelabDash could become:

* A self-hosted homelab control centre.
* A safer alternative to jumping between 10 admin panels.
* A mobile-first operations panel.
* An open-source project that homelabbers can extend.
* A base for future UniHomelab/OpenClaw AI troubleshooting.

Long-term possible features:

* Plugin marketplace.
* Community provider templates.
* OIDC auth.
* Multi-user support.
* Role-based permissions.
* Backup integrations.
* Nginx Proxy Manager integration.
* Pi-hole/AdGuard Home integration.
* Home Assistant integration.
* TrueNAS/Unraid support.
* Kubernetes support.
* Native mobile apps.

---

## Do Not Build Yet

Avoid these until the MVP is stable:

* Kubernetes support.
* Full AI automation.
* Multi-user enterprise permissions.
* Complex graphing engine.
* App store native apps.
* Plugin marketplace.
* Public cloud sync.
* Billing/SaaS features.
* Arbitrary script execution.

---

## Current MVP Target

The first meaningful release should include:

* Installable PWA
* Manual services
* Health checks
* Basic authentication
* Docker integration
* Container restart/start/stop
* Logs viewer
* Mobile-first UI
* Docker Compose deployment
* Screenshots in README

That is enough to prove the idea without overbuilding.
