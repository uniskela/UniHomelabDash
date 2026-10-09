import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const sourceRoots = ["site/src/content/docs/"];
const groups = {
  "getting-started": "Getting Started",
  integrations: "Integrations",
  operations: "Operations",
  project: "Project",
  using: "Using",
};
const preservedSlugs = [
  "readme",
  "getting-started/docker-quick-start",
  "getting-started/first-run",
  "getting-started/overview",
  "getting-started/upgrading",
  "integrations/docker",
  "integrations/manual-services",
  "integrations/portainer",
  "operations/backup-and-recovery",
  "operations/configuration",
  "operations/security",
  "operations/troubleshooting",
  "project/architecture",
  "project/brand-and-community",
  "project/contributing",
  "project/provider-model",
  "project/roadmap",
  "using/containers-and-logs",
  "using/install-the-pwa",
  "using/services-and-health",
];

// Mirrors uniskela/com scripts/sync-docs.mjs validatePageDefinitions for this
// repo's sourceRoots. docs/public remains importer-legal; this repo does not use it.
function publicationError(page, roots = sourceRoots) {
  if (!page || typeof page.source !== "string" || typeof page.slug !== "string" || !["doc", "readme"].includes(page.kind)) {
    return "invalid docs manifest page";
  }
  if ([page.source, page.slug].some((path) => path.includes("..") || /[\\%?#\s\u0000-\u001f\u007f]/.test(path)
    || path.split("/").some((part) => !part || part === "."))) {
    return "invalid docs source path or slug";
  }
  if (page.title !== undefined && typeof page.title !== "string") return "invalid docs title";
  if (page.group !== undefined && typeof page.group !== "string") return "invalid docs group";
  if (/(?:^|\/)docs\/(?:internal|agents)(?:\/|$)/i.test(page.source)) return `non-public docs source ${page.source}`;
  const validReadme = page.kind === "readme" && page.source === "README.md" && page.slug === "readme";
  const validDoc = page.kind === "doc" && /\.mdx?$/.test(page.source)
    && (page.source.startsWith("docs/public/") || roots.some((item) => page.source.startsWith(item)));
  if (!validReadme && !validDoc) return "docs manifest may only publish README.md and approved public Markdown sources";
  return null;
}

async function starlightGuides() {
  const directory = new URL("site/src/content/docs/", root);
  const entries = await readdir(directory, { recursive: true });
  return entries
    .filter((entry) => /\.mdx?$/.test(entry) && entry !== "404.mdx")
    .sort();
}

test("the publication manifest preserves Starlight URLs and importer rules", async () => {
  const manifest = JSON.parse(await read("docs/manifest.json"));
  assert.equal(manifest.schemaVersion, 1);
  assert.ok(Array.isArray(manifest.pages) && manifest.pages.length > 0);

  const sources = new Set();
  const slugs = new Set();
  for (const page of manifest.pages) {
    assert.equal(publicationError(page), null, page.source);
    assert.equal(sources.has(page.source) || slugs.has(page.slug), false);
    sources.add(page.source);
    slugs.add(page.slug);
    await access(new URL(page.source, root));
  }

  for (const slug of preservedSlugs) assert.ok(slugs.has(slug), slug);

  const guides = await starlightGuides();
  const docPages = manifest.pages.filter((page) => page.kind === "doc");
  assert.deepEqual(docPages.map((page) => page.source), guides.map((guide) => `site/src/content/docs/${guide}`));
  for (const guide of guides) {
    const page = docPages.find((item) => item.source === `site/src/content/docs/${guide}`);
    const slug = guide.replace(/\.mdx?$/, "");
    assert.equal(page.slug, slug);
    assert.equal(page.group, groups[slug.split("/")[0]]);
    assert.equal(page.source.startsWith("docs/public/"), false);
  }

  assert.equal(manifest.pages.some((page) => page.source.endsWith("/404.mdx")), false);
  assert.equal(manifest.pages.filter((page) => page.kind === "readme").length, 1);
});

test("internal plans and agent notes stay out of the publication allowlist", async () => {
  for (const source of [
    "docs/internal/superpowers/plans/2026-07-30-github-pages-docs.md",
    "docs/agents/README.md",
    "docs/public/../internal/operations.md",
    "docs/public/%2e%2e/internal/operations.md",
    "docs/branding/BRAND.md",
  ]) {
    assert.ok(publicationError({ source, slug: "hidden", kind: "doc" }), source);
  }

  await access(new URL("docs/internal/superpowers/plans/2026-08-10-stack-availability-containers.md", root));
  await assert.rejects(access(new URL("docs/superpowers/plans/2026-07-30-github-pages-docs.md", root)));
  assert.match(await read("docs/agents/README.md"), /\.\.\/\.\.\/AGENTS\.md/);
  assert.match(await read("AGENTS.md"), /docs\/manifest\.json/);
  assert.match(await read("AGENTS.md"), /docs\/internal\//);
  assert.match(await read("AGENTS.md"), /docs\/agents\//);
  assert.match(await read("site/src/content/docs/getting-started/overview.mdx"), /self-hosted/i);
});

test("manifest pages pass the uniskela.com import body checks", async () => {
  const manifest = JSON.parse(await read("docs/manifest.json"));
  for (const page of manifest.pages) {
    let body = await read(page.source);
    const frontmatter = body.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
    if (frontmatter) body = body.slice(frontmatter[0].length);
    if (page.kind === "readme") {
      body = body.replace(/^### Maintainer-only: internal infrastructure\r?\n[\s\S]*?(?=^## |$(?![\s\S]))/m, "");
    }
    assert.doesNotMatch(body, /pike[.]homes|100[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}/i, page.source);
    if (page.source.endsWith(".mdx")) {
      assert.doesNotMatch(body, /^(import .+ from |export |<[A-Z])/m, page.source);
    }
  }
});
