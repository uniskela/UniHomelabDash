import assert from "node:assert/strict";
import test from "node:test";
import { decryptCredentials, encryptCredentials, redactSecrets } from "./credentials";

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

test("redactSecrets masks common secret-looking log values", () => {
  assert.equal(
    redactSecrets(
      "Bearer abc.def token=abc123 password=hunter2 api_key=key123 secret=mysecret"
    ),
    "Bearer [redacted] token=[redacted] password=[redacted] api_key=[redacted] secret=[redacted]"
  );
});
