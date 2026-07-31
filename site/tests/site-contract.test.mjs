import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Astro targets the UniHomelabDash GitHub Pages project path", async () => {
  const config = await read("astro.config.mjs");

  assert.match(config, /site:\s*"https:\/\/uniskela\.github\.io"/);
  assert.match(config, /base:\s*"\/UniHomelabDash"/);
});

test("the site package exposes check, build, and test commands", async () => {
  const packageJson = JSON.parse(await read("package.json"));

  assert.equal(packageJson.scripts.check, "astro check");
  assert.equal(packageJson.scripts.build, "astro check && astro build");
  assert.equal(packageJson.scripts.test, "node --test tests/*.test.mjs");
});

test("the first documentation page links to the Docker quick start", async () => {
  const overview = await read("src/content/docs/getting-started/overview.mdx");

  assert.match(overview, /self-hosted/i);
  assert.match(overview, /mobile-first/i);
  assert.match(overview, /\.\/docker-quick-start/);
});

test("the homepage carries the approved product and community calls to action", async () => {
  const homepage = await read("src/pages/index.astro");

  assert.match(homepage, /Your homelab\.[\s\S]*One calm control plane\./);
  assert.match(homepage, /https:\/\/github\.com\/uniskela\/UniHomelabDash/);
  assert.match(homepage, /https:\/\/buymeacoffee\.com\/uniskela/);
  assert.match(homepage, /import\.meta\.env\.BASE_URL/);
  assert.match(homepage, /Built for homelabs, built by homelabbers/);
});

test("the visual system includes accessible focus and motion preferences", async () => {
  const css = await read("src/styles/global.css");

  assert.match(css, /#121214/i);
  assert.match(css, /#e11d48/i);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test("the site reuses the project brand and screenshots", async () => {
  await Promise.all([
    access(new URL("../public/branding/logo-wordmark-horizontal.svg", import.meta.url)),
    access(new URL("../public/branding/icon-control-rail.svg", import.meta.url)),
    access(new URL("../public/screenshots/dashboard.png", import.meta.url)),
    access(new URL("../public/screenshots/services.png", import.meta.url)),
    access(new URL("../public/screenshots/add-service.png", import.meta.url)),
  ]);
});

test("the complete operator guide is present", async () => {
  const pages = [
    "getting-started/docker-quick-start.md",
    "getting-started/first-run.md",
    "getting-started/upgrading.md",
    "using/services-and-health.md",
    "using/containers-and-logs.md",
    "using/install-the-pwa.md",
    "integrations/manual-services.md",
    "integrations/docker.md",
    "integrations/portainer.md",
    "operations/configuration.md",
    "operations/security.md",
    "operations/backup-and-recovery.md",
    "operations/troubleshooting.md",
  ];

  await Promise.all(
    pages.map((page) =>
      access(new URL(`../src/content/docs/${page}`, import.meta.url)),
    ),
  );
});

test("privileged integration docs carry explicit safety boundaries", async () => {
  const docker = await read("src/content/docs/integrations/docker.md");
  const portainer = await read("src/content/docs/integrations/portainer.md");

  assert.match(docker, /disabled by default/i);
  assert.match(docker, /Docker socket/i);
  assert.match(docker, /TCP without TLS/i);
  assert.match(docker, /confirmation/i);
  assert.match(portainer, /read-only/i);
  assert.match(portainer, /least-privilege/i);
  assert.doesNotMatch(portainer, /stack actions are available/i);
});

test("operations docs cover required production and recovery settings", async () => {
  const configuration = await read("src/content/docs/operations/configuration.md");
  const recovery = await read("src/content/docs/operations/backup-and-recovery.md");

  assert.match(configuration, /SESSION_SECRET/);
  assert.match(configuration, /COOKIE_SECURE/);
  assert.match(configuration, /PUBLIC_URL/);
  assert.match(configuration, /ALLOWED_HOSTS/);
  assert.match(recovery, /unihomelabdash-data/);
  assert.match(recovery, /RESET_ADMIN_PASSWORD/);
});
