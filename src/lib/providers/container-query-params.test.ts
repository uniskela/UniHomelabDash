import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContainerResourceQuery,
  parseInitialContainerQuery,
} from "./container-query-params";

test("container search query helpers preserve a valid exact resource query", () => {
  assert.equal(
    parseInitialContainerQuery('provider-id:"provider-1" resource-id:"7:abc"'),
    'provider-id:"provider-1" resource-id:"7:abc"'
  );
  assert.equal(parseInitialContainerQuery("x".repeat(513)), "");
  assert.equal(parseInitialContainerQuery(undefined), "");
  assert.equal(parseInitialContainerQuery(["provider-id:provider-1"]), "");
  assert.equal(parseInitialContainerQuery("\u0000\r\n"), "");
  assert.equal(parseInitialContainerQuery(" provider\u0000-id:provider-1 "), "provider-id:provider-1");
  assert.equal(
    buildContainerResourceQuery("provider-1", "7:abc"),
    'provider-id:"provider-1" resource-id:"7:abc"'
  );
});

test("buildContainerResourceQuery rejects every unsafe quoted value", () => {
  assert.throws(() => buildContainerResourceQuery("", "7:abc"));
  assert.throws(() => buildContainerResourceQuery("provider\n1", "7:abc"));
  assert.throws(() => buildContainerResourceQuery("provider\n1", "7:abc"));
  assert.throws(() => buildContainerResourceQuery("provider-1", '7:"abc'));
});
