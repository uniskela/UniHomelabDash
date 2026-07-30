import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const protectedPages = [
  "src/app/page.tsx",
  "src/app/services/page.tsx",
  "src/app/containers/page.tsx",
  "src/app/settings/page.tsx",
  "src/app/alerts/page.tsx",
];

test("protected pages explicitly enforce server-side auth", () => {
  for (const relativePath of protectedPages) {
    const absolutePath = join(process.cwd(), relativePath);
    const source = readFileSync(absolutePath, "utf8");

    assert.ok(
      source.includes("await requireAuth()"),
      `${relativePath} should call await requireAuth()`
    );
  }
});
