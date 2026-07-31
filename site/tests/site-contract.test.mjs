import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
