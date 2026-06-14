import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeLocalRedirectPath } from "./safe-redirect-path";

test("sanitizeLocalRedirectPath accepts valid local paths", () => {
  assert.equal(sanitizeLocalRedirectPath("/"), "/");
  assert.equal(sanitizeLocalRedirectPath("/services"), "/services");
  assert.equal(sanitizeLocalRedirectPath("/settings?tab=general"), "/settings?tab=general");
});

test("sanitizeLocalRedirectPath rejects unsafe paths", () => {
  const fallback = "/";

  assert.equal(sanitizeLocalRedirectPath(null), fallback);
  assert.equal(sanitizeLocalRedirectPath(undefined), fallback);
  assert.equal(sanitizeLocalRedirectPath(""), fallback);
  assert.equal(sanitizeLocalRedirectPath("//evil.com"), fallback);
  assert.equal(sanitizeLocalRedirectPath("javascript:alert(1)"), fallback);
  assert.equal(sanitizeLocalRedirectPath("https://evil.com"), fallback);
  assert.equal(sanitizeLocalRedirectPath("\\evil"), fallback);
  assert.equal(sanitizeLocalRedirectPath("services"), fallback);
});
