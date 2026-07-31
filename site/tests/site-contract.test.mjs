import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const readRoot = (path) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8");
const execFileAsync = promisify(execFile);

test("Astro targets the UniHomelabDash GitHub Pages project path", async () => {
  const config = await read("astro.config.mjs");

  assert.match(config, /site:\s*"https:\/\/uniskela\.github\.io"/);
  assert.match(config, /base:\s*"\/UniHomelabDash"/);
  assert.match(
    config,
    /label:\s*"Getting started",[\s\S]*items:\s*\[\{\s*autogenerate:/,
  );
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
  assert.match(css, /overflow-x:\s*clip/);
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

test("project documentation covers architecture, providers, roadmap, and community", async () => {
  const pages = [
    "project/architecture.md",
    "project/provider-model.md",
    "project/roadmap.md",
    "project/contributing.md",
    "project/brand-and-community.md",
  ];

  await Promise.all(
    pages.map((page) =>
      access(new URL(`../src/content/docs/${page}`, import.meta.url)),
    ),
  );

  const providerModel = await read("src/content/docs/project/provider-model.md");
  assert.match(providerModel, /service\.status/);
  assert.match(providerModel, /permission/i);
  assert.match(providerModel, /server-side/i);
});

test("repository docs link to the website and explain local site checks", async () => {
  const [readme, contributing, roadmap] = await Promise.all([
    readRoot("README.md"),
    readRoot("CONTRIBUTING.md"),
    readRoot("ROADMAP.md"),
  ]);

  assert.match(readme, /https:\/\/uniskela\.github\.io\/UniHomelabDash\//);
  assert.match(readme, /npm run site:dev/);
  assert.match(contributing, /npm install --prefix site/);
  assert.match(contributing, /npm run site:build/);
  assert.match(roadmap, /GitHub Pages/i);
});

test("GitHub Actions builds and deploys the isolated Pages artifact", async () => {
  const pagesWorkflow = await readRoot(".github/workflows/pages.yml");
  const ciWorkflow = await readRoot(".github/workflows/ci.yml");

  assert.match(pagesWorkflow, /pages:\s*write/);
  assert.match(pagesWorkflow, /id-token:\s*write/);
  assert.match(pagesWorkflow, /actions\/configure-pages@v5/);
  assert.match(pagesWorkflow, /actions\/upload-pages-artifact@v3/);
  assert.match(pagesWorkflow, /path:\s*site\/dist/);
  assert.match(pagesWorkflow, /actions\/deploy-pages@v4/);
  assert.match(ciWorkflow, /npm --prefix site ci/);
  assert.match(ciWorkflow, /npm run site:test/);
  assert.match(ciWorkflow, /npm run site:build/);
});

test("Starlight has a custom searchable-site-safe 404 entry", async () => {
  const notFound = await read("src/content/docs/404.mdx");

  assert.match(notFound, /Page not found/);
  assert.match(notFound, /pagefind:\s*false/);
  assert.match(notFound, /draft:\s*true/);
  assert.match(notFound, /getting-started\/overview/);
});

test("root lint ignores Astro-generated output", async () => {
  const root = new URL("../../", import.meta.url);
  const generatedDirectories = [
    new URL("../.astro/", import.meta.url),
    new URL("../dist/", import.meta.url),
  ];
  const generatedFiles = generatedDirectories.map(
    (directory) => new URL("eslint-ignore-contract.js", directory),
  );
  const eslint = new URL("node_modules/eslint/bin/eslint.js", root);

  await Promise.all(
    generatedDirectories.map((directory) =>
      mkdir(directory, { recursive: true }),
    ),
  );
  await Promise.all(
    generatedFiles.map((file) => writeFile(file, "const = ;\n")),
  );

  try {
    await execFileAsync(
      process.execPath,
      [
        fileURLToPath(eslint),
        ...generatedFiles.map((file) => fileURLToPath(file)),
        "--no-warn-ignored",
      ],
      { cwd: fileURLToPath(root) },
    );
  } finally {
    await Promise.all(generatedFiles.map(unlink));
  }
});

test("root typecheck stays isolated from the Astro package", async () => {
  const root = new URL("../../", import.meta.url);
  const typescript = new URL("node_modules/typescript/bin/tsc", root);
  const { stdout } = await execFileAsync(
    process.execPath,
    [fileURLToPath(typescript), "--showConfig"],
    { cwd: fileURLToPath(root) },
  );
  const config = JSON.parse(stdout);

  assert.equal(
    config.files.some((file) => file.startsWith("./site/")),
    false,
    "root TypeScript inputs must not include the independent site package",
  );
});
