import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("runtime image assets are owned by the unprivileged application user", () => {
  const dockerfile = fs.readFileSync(path.join(process.cwd(), "Dockerfile"), "utf8");

  for (const asset of ["public", "drizzle", "scripts", ".next/standalone", ".next/static"]) {
    assert.match(
      dockerfile,
      new RegExp(
        `COPY --chown=nextjs:nextjs --from=builder /app/${asset.replaceAll(".", "\\.")} `
      ),
      `${asset} must remain readable by the nextjs runtime user even when the build context uses owner-only modes`
    );
  }
});
