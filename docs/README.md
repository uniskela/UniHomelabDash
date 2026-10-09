# Documentation layout

| Audience | Canonical source | Published |
| --- | --- | --- |
| Users and operators | `site/src/content/docs/` | Starlight and the documentation importer |
| Maintainers | `internal/` | Repository only |
| Coding agents | `agents/` and root `AGENTS.md` | Repository only |

`manifest.json` is the publication allowlist. Its `source` fields are repository paths and its `slug` fields are the published URLs. Starlight pages stay in `site/src/content/docs/`; do not copy them into `docs/public/`. The importer also accepts `docs/public/`, and it rejects `docs/internal/` and `docs/agents/` even when a manifest or source root lists them.

Approved publication roots for this repository:

- `README.md` with slug `readme`
- `site/src/content/docs/` (configured source root)

Add a user guide in the Starlight tree, keep its slug equal to that path without the extension, and add the same entry to `manifest.json`. The draft `404.mdx` page is Starlight-only and stays off the manifest.

`docs/branding/` and `docs/screenshots/` stay at those paths because the README and site link to them. They are not guide pages.

“Internal” is a publication boundary, not confidentiality: these files remain visible in the public GitHub repository. Do not put secrets in any documentation tree.
