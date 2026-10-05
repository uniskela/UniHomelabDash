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

### Shipped (v0.3.0)

2. Docker read-only container status via opt-in docker.sock mount (behind auth)

### Shipped (v0.4.0)

3. Docker container start/stop/restart with confirmation modals (opt-in)
4. Remote Docker Engine over TCP/TLS with encrypted credentials

### Planned

5. Portainer integration if practical
6. Docker logs viewer

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

### Shipped in v0.3.0

* Provider system foundation (registry, capabilities, encrypted credentials helper)
* Docker read-only container list and `/containers` page
* Settings integrations UI with connection test
* Opt-in Docker socket mount via compose override example

### Shipped in v0.4.0

* Container start/stop/restart with confirmation modals (opt-in, read-only default)
* Remote Docker connection modes: local socket, TCP, TLS
* Settings UI for connection mode, TLS credentials, and actions toggle

### Planned (future phases)

* Portainer stack status and actions
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
10. For every version release, update all relevant repository documentation and the documentation website under `site/` in the same change. Keep version references, release status, shipped features, setup instructions, and upgrade guidance aligned with the released application.
11. For user-facing, operator-facing, setup, configuration, architecture, or other documented-behaviour changes, update both the relevant repository documentation and corresponding `site/` pages in the same change.
12. For internal-only changes, explicitly check for documentation impact. Do not make artificial documentation edits when documented behaviour has not changed.

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
* Relevant repository documentation and `site/` website content are current for every release and every change that affects documented behaviour.
* It does not break existing providers.

## Current Priority

v0.9.0 shipped: Container Control Centre (inspect/stats drawer, saved views,
improved logs, opt-in Portainer container start/stop/restart).

v0.9.1 shipped: UX polish pass (consistent status colours, calmer Containers,
restructured Settings, mobile touch targets, accessibility fixes).

Next focus (see ROADMAP.md):

* Alerts and activity feed foundation
* Portainer stack action safety (restart/redeploy remains deferred)

Do not chase every homelab integration at once.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- adhd-hub:project-agent:start -->
<!-- adhd-hub:guidance-version:6 -->
## ADHD Hub continuity

For substantial work in this project:

- If ADHD Hub MCP tools are missing, errored, unauthorized, or otherwise
  unavailable: on the first substantial Hub-worthy turn after detecting the
  outage, the **first line** MUST state that Hub MCP is not available, plus a
  short fix hint (MCP URL → this Hub's `/mcp`, `ADHD_HUB_AUTH_TOKEN`, restart
  the agent; skip/cancel Auth if it hangs until Hub OAuth is enabled). Repeat
  only if Hub status changes, a persistence attempt fails again, or the reply
  could otherwise imply continuity was saved. Then continue the authorized
  work. Never invent Hub state or claim a Hub write succeeded.
- **MCP unavailable** is the Hub continuity trigger (not runtime alone). Use
  the `env-check` skill — resolve `scripts/check_runtime.sh` from the installed
  skill (project-scoped: `.agents/skills/env-check/…`; Hub source:
  `skills/env-check/…`) — for CLOUD_AGENT vs LOCAL_WORKSPACE as supporting
  context (`CURSOR_AGENT`, container cues — never `$USER=root` alone). When Hub
  MCP is unreachable, use the forge issue mailbox only when issue-write access
  is available and the authenticated identity is accepted by Hub Inbox authors.
  Open/update a GitHub/Gitea issue titled `[ADHD] …` with a short
  Goal/Focus/Next/Resume cue. Optional labels: `adhd-hub`, `project:<slug>`,
  `source:cursor`; skip labels if the token cannot set them. Recommended:
  append `Made with [ADHD Progress Hub](https://github.com/uniskela/adhd-hub)`
  under a non-imported heading (e.g. `## Attribution`) so it does not land in
  Resume. Prefer short repository-relative summaries; never invent Hub
  continuity, progress, or thread state after a forge-only write. Never put
  credentials, tokens, personal/customer data, private hostnames/IPs, absolute
  local paths, transcripts, or secrets/env contents in forge issues.
- CLOUD_AGENT: do not assume machine-installed local skill CLIs (e.g.
  `graphify`) exist. If missing: one-line notice, continue via repo tools /
  committed `graphify-out/` when present; never fabricate graph or Hub state.
  Prefer headless tests and injected env/OIDC over `.env.local`; no native
  browser/macOS-Windows binaries. Hub MCP down still uses the `[ADHD]` forge
  mailbox when allowed. LOCAL_WORKSPACE: those local CLIs may be available;
  local docker / localhost OK; prefer Hub MCP when up.
- Skip Hub for trivial/read-only/tiny work.
- Once per meaningful session: `resolve_project` with
  `create_if_missing=false`, then `session_digest` with the task query. Reuse
  resolved context where possible. Create/register only after the workspace is
  authorized as a Hub project.
- **One thread = one independently finishable outcome** (not the whole repo).
  Before updating a thread, compare new work to that thread's Goal; if it does
  not advance the same outcome, use another thread or create one.
- Known thread → `upsert_progress(thread_id=...)` with compact structured state
  (goal / focus / ≤3 next / blocked if any / resume); omit ritual `content`.
  Do not silently attach to an unrelated open thread.
- `check_overlap` only before potentially new work; reuse only when the Goal
  matches. Different goal → separate thread (`force_new_thread` if needed).
- When leaving mid-task, checkpoint then `pause_thread(thread_id, next_step=...)`
  with one concrete resume action. `mark_done` only the known completed thread
  — never close unrelated overlap results.
- If Hub guidance looks stale (session_digest guidance status, or doctor),
  mention it once, keep using the current MCP contract, and recommend
  `adhd-hub setup . --refresh` and `adhd-hub sync-project .` (or
  `setup . --project-skills`) — do not nag repeatedly or hand-edit AGENTS.md.
- Summaries only; never secrets, credentials, env files, transcripts, private
  Hub URLs, internal hosts/IPs, or absolute machine paths in public artifacts.
<!-- adhd-hub:project-agent:end -->

<!-- REPOWISE_AGENTS:START — Do not edit below this line. Auto-generated by Repowise. -->
## Codebase Intelligence for UniHomelabDash (Repowise)

Indexed by [Repowise](https://repowise.dev). Last indexed: 2026-09-28 (commit aa064fe). Confidence: 100%.
### How to work in this repo

- **Trust the index.** `verified: true` means the bytes were checked against the live tree, so never re-read those lines. Re-read only on `bounds: "approximate"`, `_meta.stale_warning`, `search_method: "bm25"` or `confidence: "low"`; `index_behind: true` alone is informational.
- **Pre-edit, not instead-of-edit.** These tools decide *which* files to read and edit. Reading a file before you edit it is correct and expected.
- **Noisy commands** (tests, builds, `git log`/`diff`, searches, listings): prefer `repowise distill <cmd>`, the same command with its exit code preserved and errors-first output. A `[repowise#<ref>: N lines omitted]` marker is recoverable via `repowise expand <ref>` (add `-q <regex>` to filter); never re-run the command to see omitted output.
- **Recording a decision** you had to reason out: `repowise decision add --title T --decision D` records it without prompting and prints the id (`--format json` to parse it back). It lands `proposed`, for a person to confirm.

### Tools

| Tool | When and why |
|------|--------------|
| `get_answer(question)` | First call for any how/where/why question. Cite `confidence: "high"` or `grounding: "extracted"` directly; `degraded` means judge by `retrieval_quality`. `symbol_bodies` has live bodies. |
| `get_context(targets=[...])` | Triage card for files/modules/symbols: docs, signatures, hotspot, fix history. No source bytes — `include=["skeleton"]` for the whole file verified, `["callers"|"decisions"]` for depth. Batch targets. |
| `get_symbol(id, depth?)` | **Follow-up, not an entry point** — one verified body for an id a prior response named (`path.py::Name`, `path.py:140-180`, `repowise#<hex>`). Never walk a file symbol by symbol; Read it. |
| `search_codebase(query)` | Hybrid search, auto-routed by query shape; force with `mode=symbol|path|concept|hybrid`. A hit whose `sources` are `[fts]` only has no semantic agreement, so verify it. |
| `get_why(query, targets?)` | Why the code is shaped this way: decision records, git archaeology, rationale comments. Call before a refactor or a pattern divergence. |
| `get_risk(targets, changed_files?, include?)` | File history and structural reach. PR mode leads with `directive`; its 0-10 structural heuristic is uncalibrated, not a probability. Read typed test recommendations and coverage state first. |
| `get_change_risk(revspec?, extensions?, exclude_patterns?)` | Deterministic live-diff review signal for a commit or range. Lead with benchmarked percentile/classification; the 0-10 diff-shape score is supporting, not a probability. `get_risk` scores paths. |
| `get_health(targets?, include?)` | Defect / maintainability / performance scores and findings. Self-check the files you touched before finishing. |
| `get_dead_code(tier?, min_confidence?, safe_only?)` | Confidence-tiered unreachable files / unused exports / zombie packages. For cleanup sweeps, not targeted fixes. |
| `get_overview()` | Architecture map. Call once, first, in an unfamiliar repo; skip it after that. |

### Architecture
**Files:** 236 | **Lines:** 20442
UniHomelabDash is a typescript codebase of 236 files. Ranked by PageRank over the import graph: the files most of the codebase ultimately depends on. ---*Built from the code's structure. It states what is there, not why it is that
way.

### Key modules
- `src` — src · src/app · src/app/alerts · src/lib/settings
**Language:** typescript | **Files:** 7 | **Public symbols:** 15 / 20
Covers the 7 source…
- `src/lib/providers` — src/lib/providers · src/lib/providers/docker · src/lib/providers/manual · src/lib/providers/portainer
**Language:** typescript | **Files:**…
- `src/lib` — src/lib · src/lib/auth · src/lib/db · src/lib/providers · src/lib/providers/docker · src/lib/providers/manual · and 4 more
**Language:**…
- `src/lib/providers/docker` — src/lib/providers/docker
**Language:** typescript | **Files:** 8 | **Public symbols:** 35 / 68
Covers the 8 source files in…
- `src/components` — src/components · src/components/auth · src/components/ui
**Language:** typescript | **Files:** 43 | **Public symbols:** 90 / 170
Heads the…
- `src/components/ui` — src/components/ui
**Language:** typescript | **Files:** 12 | **Public symbols:** 54 / 56
Covers the 12 source files in src/components/ui
- `src/lib/db` — src/lib/db · src/lib/request
**Language:** typescript | **Files:** 5 | **Public symbols:** 12 / 26
Covers the 5 source files in 2…
- `src/lib/providers/manual` — src/lib/providers/manual · src/lib/providers/portainer
**Language:** typescript | **Files:** 9 | **Public symbols:** 41 / 60
Covers the 9…
- `src/app/api/auth/session-check` — src/app/api/auth/session-check · src/app/api/auth/sync-setup · src/app/api/containers · src/app/api/containers/[id]/actions ·…
- `src/lib/services` — src/lib/services
**Language:** typescript | **Files:** 6 | **Public symbols:** 12 / 19
Covers the 6 source files in src/lib/services

### Entry points
- `scripts/capture-screenshots.mjs`
- `scripts/export-icons.mjs`
- `scripts/migrate.mjs`
- `scripts/reset-admin.mjs`
- `scripts/test-stack-detail-sheet-lifecycle.mjs`
- `site/tests/site-contract.test.mjs`

### Files that need care (bug-fix history first, then churn — check `get_risk` before editing)
- `src/lib/providers/portainer/provider.ts` — 6 bug fixes, last fix 7 weeks ago (bug magnet); 11 commits/90d
- `src/lib/providers/portainer/provider.test.ts` — 5 bug fixes, last fix 7 weeks ago (bug magnet); 9 commits/90d
- `scripts/test-stack-detail-sheet-lifecycle.mjs` — 3 bug fixes, last fix 7 weeks ago; 4 commits/90d
- `src/lib/providers/portainer/client.ts` — 3 bug fixes, last fix 8 weeks ago; 8 commits/90d
- `src/lib/providers/runtime.ts` — 3 bug fixes, last fix 8 weeks ago; 8 commits/90d

### Code health
Three co-equal signals: defect risk 7.8/10 avg, hotspot health 4.91/10 (stable), worst `src/lib/providers/actions.ts` at 1.11/10 · maintainability 9.54/10 · performance risk 6 open static I/O-in-loop / N+1 findings. Detail: `get_health()`.

Critical files:
- `CONTRIBUTING.md` — change entropy — impact −2.3
- `site/tests/site-contract.test.mjs` — change entropy — impact −2.3
- `SECURITY.md` — change entropy — impact −2.0
- `ROADMAP.md` — change entropy — impact −2.0
- `ARCHITECTURE.md` — change entropy — impact −2.0

### Commands
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`
- Dev: `npm run dev`
- Typecheck: `npm run typecheck`

<!-- REPOWISE_AGENTS:END -->
