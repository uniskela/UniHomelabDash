---
title: Contributing
description: Choose scoped work, run the project, verify changes, and open a focused pull request.
sidebar:
  order: 4
---

Contributions that make UniHomelabDash safer, clearer, and more useful on a
phone are welcome.

## Before starting

Read the repository files in this order:

1. `ROADMAP.md` for current scope
2. `ARCHITECTURE.md` for technical and trust-boundary decisions
3. `AGENTS.md` for shared contribution rules
4. `SECURITY.md` when touching deployment, requests, auth, or providers

Discuss non-trivial features and integrations in an issue first. Small fixes,
documentation improvements, and focused polish are excellent starting points.

## Application development

```bash
git clone https://github.com/uniskela/UniHomelabDash.git
cd UniHomelabDash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Documentation website

```bash
npm install --prefix site
npm run site:dev
```

When changing the site:

```bash
npm run site:test
npm run site:check
npm run site:build
```

Keep pull requests small and explain the goal, files touched, verified behavior,
known limitations, and next step. Never commit credentials, real homelab URLs,
or unreviewed logs.

Read
[CONTRIBUTING.md](https://github.com/uniskela/UniHomelabDash/blob/main/CONTRIBUTING.md)
for the full workflow.
