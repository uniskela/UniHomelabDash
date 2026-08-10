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

test("stack drawer navigation initializes the containers search with exact resource scope", () => {
  const pageSource = readFileSync(join(process.cwd(), "src/app/containers/page.tsx"), "utf8");
  const asyncListSource = readFileSync(
    join(process.cwd(), "src/components/async-container-list.tsx"),
    "utf8"
  );
  const listSource = readFileSync(join(process.cwd(), "src/components/container-list.tsx"), "utf8");
  const sheetSource = readFileSync(
    join(process.cwd(), "src/components/stack-detail-sheet.tsx"),
    "utf8"
  );

  assert.ok(pageSource.includes("searchParams"));
  assert.ok(pageSource.includes("parseInitialContainerQuery"));
  assert.ok(pageSource.includes("initialSearchQuery={initialSearchQuery}"));
  assert.ok(asyncListSource.includes("initialSearchQuery"));
  assert.ok(listSource.includes("useState(initialSearchQuery)"));
  assert.ok(sheetSource.includes("buildContainerResourceQuery(container.providerId, container.id)"));
  assert.ok(sheetSource.includes('"/containers?q=" + encodeURIComponent(query)'));
  assert.ok(sheetSource.includes("View in Containers"));
});

test("stacks page loads shell without blocking on inventory", () => {
  const source = readFileSync(join(process.cwd(), "src/app/stacks/page.tsx"), "utf8");
  assert.ok(source.includes("await requireAuth()"));
  assert.ok(source.includes("AsyncStackList"));
  assert.equal(source.includes("listStackResources"), false);
});

test("stacks list exposes unavailable stacks and opens their container sheet from semantic buttons", () => {
  const source = readFileSync(join(process.cwd(), "src/components/stack-list.tsx"), "utf8");
  const sheetSource = readFileSync(
    join(process.cwd(), "src/components/stack-detail-sheet.tsx"),
    "utf8"
  );

  assert.ok(source.includes('label: "Unavailable"'));
  assert.ok(source.includes('label="Unavailable"'));
  assert.ok(source.includes("StackDetailSheet"));
  assert.ok(source.includes('type="button"'));
  assert.ok(source.includes('aria-label={`View containers for ${stack.name}`}'));
  assert.ok(sheetSource.includes("SheetContent"));
  assert.ok(sheetSource.includes('className="data-[side=right]:w-full sm:max-w-xl"'));
});
