# GitHub Pages Website and Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a professional Astro/Starlight website and complete core documentation for UniHomelabDash at `https://uniskela.github.io/UniHomelabDash/`.

**Architecture:** Add an independent static site in `site/` so documentation tooling cannot affect the Next.js runtime or Docker image. Use a custom Astro homepage for the approved Open Control Room design, Starlight for documentation routes and search, and the official GitHub Pages artifact/deployment actions.

**Tech Stack:** Astro, Starlight, TypeScript, CSS, Markdown/MDX, GitHub Actions

## Global Constraints

- Reuse the existing Control Rail logo, charcoal/ruby/burgundy palette, and real demo screenshots.
- Target `https://uniskela.github.io/UniHomelabDash/` and make every internal URL and public asset work under `/UniHomelabDash/`.
- Link to `https://github.com/uniskela/UniHomelabDash` and `https://buymeacoffee.com/uniskela`.
- Document only shipped v0.6.2 behavior; label roadmap capabilities as planned.
- Keep security guidance aligned with `SECURITY.md` and omit private maintainer infrastructure, real homelab names, and secrets.
- Keep site dependencies and their lockfile inside `site/`.
- Preserve the existing Next.js app, Docker image, API routes, and dependency graph.

---

### Task 1: Scaffold the isolated static documentation site

**Files:**
- Create: `site/package.json`
- Create: `site/package-lock.json`
- Create: `site/astro.config.mjs`
- Create: `site/tsconfig.json`
- Create: `site/src/content.config.ts`
- Create: `site/src/content/docs/getting-started/overview.mdx`
- Modify: `package.json`

**Interfaces:**
- Produces: root scripts `site:dev`, `site:check`, and `site:build`
- Produces: Astro site configured with `site: "https://uniskela.github.io"` and `base: "/UniHomelabDash"`
- Produces: Starlight content collection loaded with `docsLoader()` and validated by `docsSchema()`

- [ ] **Step 1: Create the isolated package manifest**

```json
{
  "name": "unihomelabdash-docs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "check": "astro check",
    "build": "astro check && astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/check": "^0.9.0",
    "@astrojs/starlight": "^0.36.0",
    "astro": "^5.0.0",
    "sharp": "^0.35.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Install the site dependencies**

Run: `npm install --prefix site`

Expected: `site/package-lock.json` is generated without modifying the root lockfile.

- [ ] **Step 3: Configure Astro, Starlight, and the docs content collection**

Use `site` and `base` exactly as specified above. Configure the title, description, logo, GitHub social link, edit links, custom CSS, sidebar groups matching the design spec, and `lastUpdated: true`.

- [ ] **Step 4: Add the first docs route and root convenience scripts**

The overview page must state that UniHomelabDash is a self-hosted, mobile-first control plane and link to the Docker quick start. Root scripts call `npm --prefix site run <script>`.

- [ ] **Step 5: Verify the scaffold**

Run: `npm run site:check`

Expected: Astro content and TypeScript checks pass.

- [ ] **Step 6: Commit**

```bash
git add package.json site
git commit -m "build: scaffold GitHub Pages documentation site"
```

### Task 2: Implement the Open Control Room visual system and homepage

**Files:**
- Create: `site/src/pages/index.astro`
- Create: `site/src/styles/global.css`
- Create: `site/src/components/SiteHeader.astro`
- Create: `site/src/components/AppPreview.astro`
- Create: `site/src/components/FeatureCard.astro`
- Create: `site/src/components/SiteFooter.astro`
- Create: `site/public/branding/logo-wordmark-horizontal.svg`
- Create: `site/public/branding/icon-control-rail.svg`
- Create: `site/public/favicon.svg`
- Create: `site/public/screenshots/dashboard.png`
- Create: `site/public/screenshots/services.png`
- Create: `site/public/screenshots/add-service.png`

**Interfaces:**
- Consumes: `import.meta.env.BASE_URL` for base-aware local routes and public assets
- Produces: reusable `SiteHeader`, `AppPreview`, `FeatureCard`, and `SiteFooter` Astro components
- Produces: responsive `/` landing page with GitHub, documentation, and support calls to action

- [ ] **Step 1: Copy the existing public brand and screenshot assets**

Copy from `docs/branding/` and `docs/screenshots/`; do not redraw or alter the source assets.

- [ ] **Step 2: Build the base-aware header and footer**

The header contains logo, Features, Docs, Roadmap, Contribute, GitHub, and Support. The footer contains MIT license text plus Documentation, Security, Roadmap, GitHub, and Buy Me a Coffee links.

- [ ] **Step 3: Build the app preview and feature card components**

`AppPreview` renders a compact, accessible dashboard facsimile with decorative elements hidden from assistive technology. `FeatureCard` accepts `eyebrow`, `title`, and default-slot body content.

- [ ] **Step 4: Implement the approved hybrid homepage**

Include: self-hosted/private/built-in-the-open eyebrow; “Your homelab. One calm control plane.” headline; Get started and View on GitHub actions; current capability proof; real dashboard screenshot; safety-first feature section; four-step install-to-contribute journey; shipped/planned roadmap split; and the GitHub/Buy Me a Coffee community close.

- [ ] **Step 5: Implement the shared brand theme**

Use charcoal `#121214`, surface `#1c1c1f`, ruby `#e11d48`, burgundy `#7f1d1d`, off-white `#f4f4f5`, and zinc `#a1a1aa`. Add visible focus states, responsive rules at 900px and 640px, and a `prefers-reduced-motion` override.

- [ ] **Step 6: Verify responsive rendering**

Run: `npm run site:build`

Expected: the homepage and docs compile with no broken internal links or missing assets.

- [ ] **Step 7: Commit**

```bash
git add site
git commit -m "feat: add Open Control Room documentation homepage"
```

### Task 3: Write the complete operator documentation

**Files:**
- Create: `site/src/content/docs/getting-started/docker-quick-start.md`
- Create: `site/src/content/docs/getting-started/first-run.md`
- Create: `site/src/content/docs/getting-started/upgrading.md`
- Create: `site/src/content/docs/using/services-and-health.md`
- Create: `site/src/content/docs/using/containers-and-logs.md`
- Create: `site/src/content/docs/using/install-the-pwa.md`
- Create: `site/src/content/docs/integrations/manual-services.md`
- Create: `site/src/content/docs/integrations/docker.md`
- Create: `site/src/content/docs/integrations/portainer.md`
- Create: `site/src/content/docs/operations/configuration.md`
- Create: `site/src/content/docs/operations/security.md`
- Create: `site/src/content/docs/operations/backup-and-recovery.md`
- Create: `site/src/content/docs/operations/troubleshooting.md`

**Interfaces:**
- Consumes: the root README and SECURITY files as factual sources
- Produces: task-oriented operator pages reachable through the Starlight sidebar
- Produces: exact environment-variable and Docker connection-mode references

- [ ] **Step 1: Write onboarding and upgrade guides**

Document `.env` creation, `SESSION_SECRET`, Compose startup, first-run `/setup`, persistent `/app/data`, HTTPS cookie configuration, and version-specific upgrade safeguards.

- [ ] **Step 2: Write daily-use guides**

Document manual services, health checks, dashboard sorting, containers, filters, logs, action confirmation, and PWA installation without claiming background polling or notifications.

- [ ] **Step 3: Write integration guides**

Cover manual services, Docker socket/TCP/TLS modes, encrypted TLS material, action opt-in, Portainer token setup, custom CA support, read-only endpoint/container/log behavior, and current Portainer limitations.

- [ ] **Step 4: Write operations guides**

Include the complete environment-variable table, trusted-network/HTTPS guidance, Docker socket risk, SQLite volume backup procedure, admin reset commands, connection troubleshooting, and safe issue-reporting guidance.

- [ ] **Step 5: Check factual and link accuracy**

Run: `npm run site:check`

Expected: all frontmatter, links, and code blocks validate.

- [ ] **Step 6: Scan for private infrastructure**

Run: `rg -n "git\\.pike|pike\\.homes|tailscale|REGISTRY_TOKEN|DOCKERHUB_TOKEN" site/src site/public`

Expected: no matches except generic public-facing security guidance that does not name internal infrastructure.

- [ ] **Step 7: Commit**

```bash
git add site/src/content/docs
git commit -m "docs: add operator and integration guides"
```

### Task 4: Add contributor documentation and repository integration

**Files:**
- Create: `site/src/content/docs/project/architecture.md`
- Create: `site/src/content/docs/project/provider-model.md`
- Create: `site/src/content/docs/project/roadmap.md`
- Create: `site/src/content/docs/project/contributing.md`
- Create: `site/src/content/docs/project/brand-and-community.md`
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `ROADMAP.md`

**Interfaces:**
- Consumes: root ARCHITECTURE, ROADMAP, CONTRIBUTING, AGENTS, and branding guides
- Produces: public contributor onboarding and provider-contract overview
- Produces: repository links and commands that make the site discoverable and maintainable

- [ ] **Step 1: Write project and contributor pages**

Explain the single-app architecture, server-only provider boundary, capabilities and safety metadata, current roadmap status, scope boundaries, local setup, verification commands, pull-request expectations, brand usage, GitHub participation, and optional sponsorship.

- [ ] **Step 2: Update the README**

Add a visible website/documentation link near the introduction and a short “Documentation website” development section with `npm run site:dev`, `npm run site:check`, and `npm run site:build`.

- [ ] **Step 3: Update CONTRIBUTING**

Add site dependency installation (`npm install --prefix site`) and require `npm run site:check`/`npm run site:build` when website content or components change.

- [ ] **Step 4: Update ROADMAP**

Record the GitHub Pages website and core documentation as shipped project infrastructure without changing product feature priorities.

- [ ] **Step 5: Verify repository copy**

Run: `rg -n "uniskela.github.io/UniHomelabDash|buymeacoffee.com/uniskela" README.md CONTRIBUTING.md ROADMAP.md site/src`

Expected: the public docs URL is discoverable and support links appear only in appropriate community surfaces.

- [ ] **Step 6: Commit**

```bash
git add README.md CONTRIBUTING.md ROADMAP.md site/src/content/docs/project
git commit -m "docs: connect project and contributor documentation"
```

### Task 5: Add GitHub Pages deployment and complete verification

**Files:**
- Create: `.github/workflows/pages.yml`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: Pages artifact from `site/dist`
- Produces: deployment environment `github-pages` with output URL from `steps.deployment.outputs.page_url`
- Produces: pull-request CI coverage for the static site

- [ ] **Step 1: Add Pages build and deployment workflow**

Trigger on pushes to `main` and `workflow_dispatch`. Set `contents: read`, `pages: write`, and `id-token: write`; configure Pages; set up Node 24 with `site/package-lock.json` caching; run `npm ci --prefix site`; run `npm run site:build`; upload `site/dist`; then deploy with `actions/deploy-pages`.

- [ ] **Step 2: Add docs checks to pull-request CI**

After the root install, install site dependencies with `npm ci --prefix site`, then run `npm run site:check` and `npm run site:build`.

- [ ] **Step 3: Run static-site verification**

Run:

```bash
npm ci --prefix site
npm run site:check
npm run site:build
```

Expected: all commands pass and `site/dist/index.html` plus documentation routes exist.

- [ ] **Step 4: Inspect the generated site**

Confirm generated files contain `/UniHomelabDash/` asset/navigation paths, both external project links, no internal infrastructure names, a custom 404 page, and no missing screenshot or logo references.

- [ ] **Step 5: Run existing application verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all existing checks pass with no application behavior changes.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/pages.yml .github/workflows/ci.yml
git commit -m "ci: deploy documentation to GitHub Pages"
```

- [ ] **Step 7: Final status review**

Run: `git status --short`

Expected: clean worktree except for any user-owned changes identified before execution.
