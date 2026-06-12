# UniHomelabDash Colour Palette

Flat fills only. One accent hue family (ruby → burgundy). Values map to shadcn OKLCH tokens in `src/app/globals.css`.

## Core tokens

| Role | Name | Hex | OKLCH | CSS variable | Usage |
|------|------|-----|-------|--------------|-------|
| Canvas | Charcoal 950 | `#121214` | `oklch(0.145 0.006 285)` | `--background` (dark) | App background, PWA `theme_color` |
| Surface | Charcoal 900 | `#1c1c1f` | `oklch(0.205 0.008 285)` | `--card` (dark) | Cards, sidebar |
| Surface raised | Charcoal 800 | `#27272a` | `oklch(0.269 0.008 285)` | `--secondary`, `--muted` (dark) | Hover, inputs |
| Border | — | — | `oklch(1 0 0 / 12%)` | `--border` (dark) | Dividers |
| Text primary | Off-white | `#f4f4f5` | `oklch(0.985 0 0)` | `--foreground` (dark) | Body text |
| Text muted | Zinc 400 | `#a1a1aa` | `oklch(0.708 0.01 285)` | `--muted-foreground` (dark) | Secondary labels |
| Accent | Ruby 500 | `#e11d48` | `oklch(0.58 0.22 12)` | `--primary` (dark) | Actions, active nav, logo accent |
| Accent foreground | — | `#fafafa` | `oklch(0.985 0 0)` | `--primary-foreground` (dark) | Text on ruby buttons |
| Accent deep | Burgundy 700 | `#7f1d1d` | `oklch(0.38 0.14 20)` | `--sidebar-primary` (dark) | Sidebar emphasis, maskable icon bg |
| Accent mid | Burgundy 500 | `#9f1239` | `oklch(0.45 0.16 15)` | `--chart-1` (dark) | Charts, wordmark underline |
| Destructive | Ruby 600 | `#be123c` | `oklch(0.52 0.2 12)` | `--destructive` (dark) | Destructive actions |

## Semantic status

Health and status colours avoid the green “online” homelab cliché.

| State | Name | Hex | Tailwind utility (reference) |
|-------|------|-----|------------------------------|
| Healthy | Ruby 400 | `#fb7185` | `border-rose-400/40 bg-rose-400/10 text-rose-300` |
| Degraded | Amber 500 | `#f59e0b` | `border-amber-500/40 bg-amber-500/10 text-amber-300` |
| Down / unknown | Zinc 500 | `#71717a` | `border-border bg-muted/40 text-muted-foreground` |
| Active check | Ruby 500 | `#e11d48` | Primary spinner / checking state |

## Logo colours

| Element | Hex |
|---------|-----|
| Icon background | `#121214` |
| Service row (dark) | `#3f3f46` |
| Service row (mid) | `#52525b` |
| Service row (light) | `#71717a` |
| Status pill / accent | `#e11d48` |
| Maskable background | `#7f1d1d` |
| Maskable rows | `#f4f4f5` / `#d4d4d8` / `#a1a1aa` |

## Light mode

Light mode keeps neutral zinc primaries for readability. Ruby accent appears on destructive and brand surfaces only; dark mode is the canonical brand experience.

## Migration notes

When updating `globals.css`:

1. Set `.dark --primary` to ruby OKLCH.
2. Replace `.dark --sidebar-primary` blue with burgundy.
3. Set `.dark --chart-1` to burgundy mid for brand-aligned charts.
4. Align `--destructive` with deeper ruby in both themes.
