import assert from "node:assert/strict";
import test from "node:test";
import { decryptCredentials, encryptCredentials } from "./credentials";

const TEST_SECRET = "test-session-secret-for-credentials";

test("encryptCredentials and decryptCredentials round-trip", () => {
  const encrypted = encryptCredentials({ apiToken: "secret-token" }, TEST_SECRET);
  assert.notEqual(encrypted, "secret-token");
  assert.deepEqual(decryptCredentials(encrypted, TEST_SECRET), {
    apiToken: "secret-token",
  });
});

test("decryptCredentials fails with wrong secret", () => {
  const encrypted = encryptCredentials({ apiToken: "secret-token" }, TEST_SECRET);
  assert.throws(() => decryptCredentials(encrypted, "wrong-secret"));
});
