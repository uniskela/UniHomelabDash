import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("containers list API route requires auth", () => {
  const source = readFileSync(join(process.cwd(), "src/app/api/containers/route.ts"), "utf8");
  assert.ok(source.includes("await requireAuth()"));
  assert.ok(source.includes("listContainerResources"));
});

test("containers page loads shell without blocking on inventory", () => {
  const source = readFileSync(join(process.cwd(), "src/app/containers/page.tsx"), "utf8");
  assert.ok(source.includes("await requireAuth()"));
  assert.ok(source.includes("AsyncContainerList"));
  assert.equal(source.includes("listContainerResources"), false);
});
