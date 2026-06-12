# UniHomelabDash Architecture Decision

UniHomelabDash should start as a small, secure, mobile-first PWA that can grow into a broader homelab control centre.

The first architecture decision should optimise for:

* Fast solo development.
* Strong frontend and backend typing.
* Safe provider integrations.
* A polished installable web app.
* Simple self-hosted deployment.
* Clear upgrade paths for native apps and heavier background work later.

The recommended MVP stack is:

* Next.js + TypeScript.
* Tailwind CSS.
* shadcn/ui.
* SQLite.
* Drizzle ORM.
* Auth.js or simple custom session auth.
* Docker Compose deployment.
* Optional Redis later only if background jobs become complex.
* Optional Tauri or Capacitor later after the PWA is stable.

---

## Stack Options

## 1. Next.js + TypeScript

Next.js is the best first choice for UniHomelabDash because it can ship the frontend PWA and backend API surface from one codebase.

Strengths:

* One TypeScript project can cover UI, provider contracts, API handlers, validation, and shared types.
* API routes and server actions are enough for the MVP backend.
* React fits a dashboard/control-plane UI with cards, filters, modals, logs, and real-time status updates.
* The ecosystem works well with Tailwind CSS, shadcn/ui, Auth.js, Drizzle, SQLite, and PWA tooling.
* A single app is simpler to deploy with Docker Compose than a split frontend/backend stack.
* It leaves room for future real-time updates, AI-assisted troubleshooting, and modular integrations without changing languages.

Tradeoffs:

* Long-running background jobs should not live only inside request handlers.
* Privileged host access, such as Docker actions, needs a careful backend or agent boundary.
* The app should avoid using every Next.js feature early; the MVP should stay simple.

Recommendation:

* Use a single Next.js app for the MVP.
* Use API routes or server actions for backend operations.
* Keep provider code server-side unless it is pure shared typing.
* Add a worker process or separate agent later only when the feature set requires it.

---

## 2. Vite + React + Separate Node API

Vite with React and a separate Node API is also a strong option. It provides clear separation between frontend and backend from day one.

Strengths:

* Very fast frontend development.
* Clean split between the browser app and backend API.
* Flexible backend framework choices such as Fastify, Hono, or Express.
* Good fit if the project quickly needs a dedicated API service or worker.

Tradeoffs:

* More moving parts for the MVP.
* Shared types, validation, auth, and deployment need more setup.
* Docker Compose must manage at least two app services earlier.
* The solo-maintainer cost is higher before the project proves its shape.

Recommendation:

* Keep this as a future split path if the single Next.js app becomes too constrained.
* Do not start here unless the MVP immediately needs independent frontend and API deployment.

---

## 3. PHP/Laravel

Laravel is capable, mature, well documented, and excellent for many self-hosted web applications.

It is not the best first choice for UniHomelabDash because this project is primarily a modern PWA dashboard and control-plane UI. The highest-value early work is shared frontend/backend typing, provider contracts, interactive service cards, real-time status surfaces, and a React-based mobile interface.

Why TypeScript fits better here:

* Provider contracts can be shared between server code, API responses, and UI capability checks.
* Frontend and backend validation can stay aligned more easily.
* React dashboard UI work is first-class in the TypeScript ecosystem.
* Future AI integrations will likely use TypeScript-friendly SDKs and streaming UI patterns.
* Real-time status updates and rich client state are more natural in a TypeScript-first app.

Laravel tradeoffs:

* A React PWA would still need a frontend build system and type boundary.
* Sharing provider capability types between PHP and React would require extra conventions or generated schemas.
* It may encourage a more traditional server-rendered app shape than the desired installable control-plane experience.

Recommendation:

* Do not use Laravel for the MVP.
* Reconsider PHP only if the project later needs Laravel-specific strengths such as its admin tooling, queues, or ecosystem integrations.

---

## 4. Go Backend + React Frontend

A Go backend with a React frontend is a strong architecture for a mature control-plane system.

Strengths:

* Excellent for small static binaries, agents, background workers, and host-level integrations.
* Good fit for privileged local agents that talk to Docker, Proxmox, or host services.
* Strong performance and concurrency.
* Easy to deploy as a separate backend or sidecar.

Tradeoffs:

* More complexity than the MVP needs.
* Shared frontend/backend types require OpenAPI, code generation, or duplicated models.
* UI iteration becomes slower with two languages and two app surfaces.
* Auth, database, migrations, and deployment need more glue.

Recommendation:

* Do not start with Go for the main MVP app.
* Consider Go later for a limited privileged agent if Docker socket access or host-level actions need stronger isolation from the web app.

---

## 5. Tauri or Capacitor Native Wrapper Later

UniHomelabDash should start as a PWA. Native wrappers can come later if the web app proves useful and native capabilities are genuinely needed.

Capacitor strengths:

* Good path from web app to iOS and Android wrappers.
* Fits PWA-first React apps.
* Useful if push notifications, mobile packaging, or app-store distribution become important.

Tauri strengths:

* Strong desktop app option.
* Can provide native desktop integration with a small footprint.
* Useful if local desktop control or native OS access becomes valuable.

Tradeoffs:

* Native wrappers add release, signing, testing, and support overhead.
* They do not solve the core MVP problem of building a useful, secure dashboard.
* Mobile browser installability may be enough for a long time.

Recommendation:

* Build the PWA first.
* Revisit Capacitor for iOS/Android and Tauri for desktop after the PWA is stable.

---

## Recommended MVP Architecture

Start with a single Next.js app.

Core pieces:

* Frontend PWA using React, TypeScript, Tailwind CSS, and shadcn/ui.
* Backend operations through Next.js API routes or server actions.
* SQLite database for local app state.
* Drizzle ORM for typed schema and queries.
* Auth.js or simple custom session auth for a single admin user.
* Provider abstraction layer for integrations.
* Docker Compose deployment.
* PWA manifest and service worker.
* Mobile-first dashboard, services, actions, alerts, and settings UI.

Provider order:

1. Manual services provider.
2. Docker provider.
3. Portainer provider.

Later integrations such as Proxmox, Arr stack, Jellyfin, Immich, Nginx Proxy Manager, Pi-hole, alerts, and AI-assisted troubleshooting should wait until the base app is usable and safe.

Background jobs:

* Start with simple in-process scheduled checks only if needed.
* Add a dedicated worker process when checks, alerts, or provider syncs become more complex.
* Add Redis only if job queues, retries, or distributed coordination become necessary.

Native apps:

* Treat the PWA as the primary product.
* Add Capacitor or Tauri later only after the PWA is stable and the native use case is clear.

---

## Immediate Build Scope

The first build must stay focused on the smallest useful product.

Manual services are the MVP. UniHomelabDash must be useful as a basic homelab dashboard before it becomes a control plane.

The first build must only implement:

* PWA shell.
* Dashboard page.
* Services page.
* Alerts page.
* Settings page.
* Manual services CRUD.
* SQLite persistence.
* Mobile-first UI.
* Docker Compose deployment.

The first build must not implement yet:

* Proxmox.
* Docker socket access.
* Portainer actions.
* Arr stack.
* Jellyfin.
* Immich.
* AI assistant.
* Notifications.
* Native mobile wrapper.
* Complex authentication.

Authentication decision:

* Defer application authentication to the next phase if first-run admin auth would delay the MVP.
* Do not expose privileged integrations before authentication exists.
* Keep this first build limited to manual services and non-privileged local data.

---

## Security Model

UniHomelabDash is a control-plane app. It must treat integrations and actions as privileged operations.

**Current state (v0.1.0):** The public manual-services release ships **without authentication**. It is intended for trusted homelab networks only. See [SECURITY.md](SECURITY.md) for deployment guidance.

**Target state (Phase 4+):** Authentication before dashboard access, then privileged integrations behind confirmed actions.

Required rules:

* Require authentication before all dashboard access (target; not yet implemented in v0.1.0).
* Store secrets server-side only.
* Never store API tokens in frontend localStorage.
* Redact secrets from logs and error messages.
* Default integrations to read-only mode first.
* Require confirmation for disruptive actions such as restart, stop, and redeploy.
* Show the exact service, container, stack, or provider affected before running an action.
* Keep provider failures isolated so one broken integration does not crash the dashboard.

Docker-specific rules:

* Never expose Docker socket access to the frontend.
* Avoid mounting `/var/run/docker.sock` into the main web app unless clearly documented and restricted.
* Prefer a limited backend agent or proxy model for privileged Docker actions.
* Do not allow raw shell execution in the MVP.
* Do not allow arbitrary command execution.
* Do not blindly retry dangerous actions.

Recommended Docker path:

* Begin with a read-only Docker provider where possible.
* If direct Docker socket access is used for development, document the risk clearly.
* For production, prefer a constrained backend agent or proxy that exposes only the actions UniHomelabDash supports.
* Keep start, stop, restart, and redeploy behind explicit confirmation and provider-level action settings.

---

## Decision

Use Next.js + TypeScript for the MVP.

This keeps the first version small, typed, and easy to maintain while still leaving a clean path to a split API, worker, Redis queue, Go agent, Capacitor wrapper, or Tauri desktop app later.
