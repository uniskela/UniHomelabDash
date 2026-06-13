import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "./password";

test("hashPassword and verifyPassword round-trip", async () => {
  const hash = await hashPassword("correct-horse-battery");
  assert.notEqual(hash, "correct-horse-battery");
  assert.equal(await verifyPassword("correct-horse-battery", hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});
