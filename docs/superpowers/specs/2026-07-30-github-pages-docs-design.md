# GitHub Pages Website and Documentation Design

## Goal

Create a professional, friendly, open-source website for UniHomelabDash at `https://uniskela.github.io/UniHomelabDash/`. The site should help prospective users understand the product, help operators install and use it safely, and make contributors feel welcome.

The approved visual direction is **Open Control Room**: a product-led landing page based on the existing charcoal, ruby, and Control Rail brand, followed by a warm community journey and restrained support call to action.

## Architecture

- Add an isolated Astro + Starlight static site under `site/` so documentation dependencies do not affect the production Next.js application or Docker image.
- Configure the production site URL as `https://uniskela.github.io` with the `/UniHomelabDash` base path. Local development continues to work at `/`.
- Add root npm scripts for site development, checking, and production builds while keeping the site's own package and lockfile independent.
- Deploy the generated static output with the official GitHub Pages Actions flow on pushes to `main`, with manual workflow dispatch available.
- Keep the root README as a concise, runnable project overview and direct readers to the website for expanded guidance.

## Experience and Visual Design

- Reuse the existing Control Rail logo, charcoal surfaces, ruby accent, burgundy depth colour, Geist-style typography, rounded panels, and real project screenshots.
- Build a bespoke responsive homepage with product navigation; a clear self-hosted/private/built-in-the-open hero; primary **Get started** and secondary **View on GitHub** actions; current feature proof; real screenshots; a four-step install-to-contribute journey; roadmap preview; and community/support close.
- Link prominently to `https://github.com/uniskela/UniHomelabDash` and `https://buymeacoffee.com/uniskela`. Sponsorship language stays optional and appreciative, never blocking documentation.
- Use Starlight's accessible documentation shell for reading pages, navigation, search, code blocks, mobile menus, dark/light themes, and previous/next links, customized to match the product brand.
- Clearly distinguish shipped features from planned work and keep security warnings visible near privileged Docker and Portainer setup.

## Documentation Structure

- **Getting started:** overview, Docker Compose quick start, first-run setup, and upgrades.
- **Using UniHomelabDash:** dashboard and services, health checks, containers/logs/actions, and PWA installation.
- **Integrations:** manual services, Docker local/TCP/TLS configuration, and Portainer read-only setup.
- **Operations:** configuration reference, security hardening, data backup/recovery, troubleshooting, and admin-password recovery.
- **Project:** architecture/provider model, roadmap, contributing, and brand/community resources.

The website content is derived from the current README, SECURITY, CONTRIBUTING, ROADMAP, ARCHITECTURE, and AGENTS guidance. It must not expose internal maintainer infrastructure, real homelab hostnames, secrets, or unsupported capabilities.

## Content Maintenance

- Treat root policy files as the source of truth for security, scope, and architecture; website pages present their user-facing form and link back where helpful.
- Keep version-specific wording accurate for the current v0.6.2 state without introducing documentation versioning in the first release.
- Update the website when installation, configuration, integrations, security behavior, or contribution workflows change.
- Add the website milestone to ROADMAP and document local site commands in CONTRIBUTING and README.

## Failure Handling and Deployment Safety

- Fail the Pages workflow when Astro checks, broken internal links, or the production build fail.
- Use repository-relative helpers or Astro's base-aware paths so assets and navigation work under `/UniHomelabDash/` rather than only at a domain root.
- Keep external links explicit and HTTPS-only. GitHub Actions receives only `contents: read`, `pages: write`, and `id-token: write`; the site has no runtime secrets or backend.
- Use a deployment concurrency group so a newer Pages build supersedes an obsolete queued run without interrupting an active deployment.

## Verification

- Run the site type/content check and production build locally.
- Serve the production output under the repository base path and verify navigation, logo assets, screenshots, GitHub links, Buy Me a Coffee link, search, and 404 behavior.
- Check homepage and documentation layouts at phone, tablet, and desktop widths, including keyboard focus and reduced-motion behavior.
- Run the existing root lint, typecheck, tests, and Next.js build to confirm the isolated site did not affect the application.
- Review public copy against the root documentation for shipped/planned accuracy and scan generated output for internal hostnames or secrets.

## Accepted Decisions

- Audience: prospective users and contributors, with operator documentation as the core utility.
- URL: standard project Pages at `https://uniskela.github.io/UniHomelabDash/`; no custom domain.
- Engine: isolated Astro + Starlight site.
- Scope: complete core guide at launch; no documentation versioning, blog, analytics, comments, or runtime service.
- Visual direction: approved A/C hybrid, **Open Control Room**.
