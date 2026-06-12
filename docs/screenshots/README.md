# Screenshots

These images are **generated demo screenshots**, not captures from a real homelab deployment.

- Demo data uses fictional `*.example.local` URLs and generic hosts (`nas.local`, `docker-host`).
- Branding should show charcoal surfaces, ruby primary actions, burgundy/rose healthy status, and amber degraded status — no blue sidebar accents or green “online” badges.
- Capture viewport is mobile (390×844, dark mode) via Playwright.
- Full-page shots pin the bottom nav to the document end so Playwright does not duplicate the fixed bar mid-image.

## Regenerate

After UI or branding changes:

```bash
npm run icons:export   # when SVG brand assets change
npm run build
npm run screenshots
```

The capture script ([`scripts/capture-screenshots.mjs`](../../scripts/capture-screenshots.mjs)) seeds a temporary SQLite database and never reads `data/unihomelabdash.sqlite`.

Output files:

- `dashboard.png`
- `services.png`
- `add-service.png`
