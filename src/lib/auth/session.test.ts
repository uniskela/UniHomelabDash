import assert from "node:assert/strict";
import test from "node:test";
import {
  createSessionToken,
  createSetupToken,
  verifySessionToken,
  verifySetupToken,
} from "./session";

const originalSecret = process.env.SESSION_SECRET;

test("session token verifies and rejects tampering", async () => {
  process.env.SESSION_SECRET = "test-session-secret";

  const token = await createSessionToken("user-123");
  const payload = await verifySessionToken(token);

  assert.equal(payload?.userId, "user-123");
  assert.equal(await verifySessionToken(`${token}tampered`), null);
});

test("setup token verifies", async () => {
  process.env.SESSION_SECRET = "test-session-secret";

  const token = await createSetupToken();
  assert.equal(await verifySetupToken(token), true);
  assert.equal(await verifySetupToken("invalid.token"), false);
});

test.after(() => {
  if (originalSecret === undefined) {
    delete process.env.SESSION_SECRET;
  } else {
    process.env.SESSION_SECRET = originalSecret;
  }
});
