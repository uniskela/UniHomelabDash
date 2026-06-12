# UniHomelabDash Brand Guide

UniHomelabDash is a self-hosted, mobile-first PWA evolving from a service dashboard into a **homelab control plane** — monitoring, safe actions, alerts, and logs — not a static bookmark board.

## Positioning

| Dimension | UniHomelabDash |
|-----------|----------------|
| Product | Unified homelab control centre |
| Audience | Self-hosters who want phone-first ops |
| Tone | Calm, competent, private, thumb-friendly |
| Visual feel | Instrument panel, not startup landing page |

## Naming

| Context | Name |
|---------|------|
| Wordmark, repo, docs, sidebar | **UniHomelabDash** |
| PWA short name, icon-only, favicon | **HomelabDash** |
| Monogram-only (Concept B mark) | **UniDash** — never spelled in the mark itself |

Use the full wordmark when space allows (~120px+ width). Switch to the icon mark below that.

## Logo concepts

Three flat SVG concepts live in this directory. **Concept A (Control Rail)** is the primary brand mark.

| File | Concept | Use |
|------|---------|-----|
| `icon-control-rail.svg` | Control Rail | Primary app icon, PWA, in-app brand |
| `icon-uni-frame.svg` | Uni Frame | Monogram fallback, burgundy backgrounds |
| `icon-hearth-node.svg` | Hearth Node | GitHub avatar variant, social |
| `logo-wordmark-horizontal.svg` | Mark + text inline | Sidebar, README header |
| `logo-wordmark-stacked.svg` | Mark above text | README, docs hero |
| `github-avatar-control-rail.svg` | Simplified Control Rail | GitHub org/repo avatar |
| `github-avatar-uni-frame.svg` | Uni Frame on burgundy | Alternate avatar |
| `github-avatar-hearth-node.svg` | Hearth Node | Alternate avatar |
| `icon-maskable-burgundy.svg` | Control Rail on burgundy | Android maskable PWA |

## Colour

See [PALETTE.md](./PALETTE.md) for hex, OKLCH, and CSS token mapping.

**Principles:** Flat fills only. Charcoal carries ~90% of surface area. Ruby is the action accent. Burgundy adds depth (logos, maskable icons, sidebar emphasis).

## Typography

| Layer | Face | Weight | Use |
|-------|------|--------|-----|
| UI / body | Geist Sans | 400–500 | Cards, forms, navigation |
| Data / IDs | Geist Mono | 400–500 | Hosts, timestamps, latency |
| Wordmark | Geist Sans | 600 | `UniHomelabDash` lockup |

**Wordmark treatment:** At large sizes, **Uni** may use weight 500 and **HomelabDash** weight 600. At sidebar scale (`text-sm`), use uniform semibold.

Do not add display serifs, sci-fi faces, or a second UI font.

## Icon grid

- **ViewBox:** `0 0 512 512`
- **Maskable safe zone:** centre 410×410 (80%)
- **Corner radius:** `rx="96"` on full-bleed background
- **Stroke:** prefer fills; max 2 neutral fills + 1 accent per mark

## Do

- Use ruby sparingly (one accent region per screen)
- Place logos on charcoal (`#121214`) or white only
- Use 8px-radius multiples (aligns with `--radius: 0.625rem`)
- Keep SVG sources hand-editable and under ~2KB

## Don't

- Blue, cyan, or green “homelab” accent colours in brand marks
- Gradients, glows, or glassmorphism on logos
- Detailed server, rack, or network illustrations
- Shrink the wordmark below ~120px width without switching to icon-only

## Touchpoints

| Asset | Location |
|-------|----------|
| App icon (SVG) | `public/icon.svg` |
| PWA PNGs | `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` |
| Favicon | `public/favicon.ico` |
| Theme colour | `src/app/manifest.ts` → `#121214` |
| In-app brand | `src/components/brand-icon.tsx` |
| CSS tokens | `src/app/globals.css` |
