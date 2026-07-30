import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultContainerViewPreferences,
  maxHiddenContainers,
  normalizeContainerViewPreferences,
  parseContainerViewPreferences,
  serializeContainerViewPreferences,
  toggleHiddenContainer,
  type ContainerViewPreferences,
} from "./container-preferences";

test("parseContainerViewPreferences falls back to defaults for bad input", () => {
  assert.deepEqual(parseContainerViewPreferences(null), defaultContainerViewPreferences);
  assert.deepEqual(parseContainerViewPreferences("not json"), defaultContainerViewPreferences);
  assert.deepEqual(parseContainerViewPreferences("[]"), defaultContainerViewPreferences);
});

test("parseContainerViewPreferences keeps known values and drops unknown ones", () => {
  assert.deepEqual(
    parseContainerViewPreferences(
      JSON.stringify({ view: "tiles", groupBy: "host", hidden: ["nas::redis"] })
    ),
    { view: "tiles", groupBy: "host", hidden: ["nas::redis"] }
  );

  assert.deepEqual(
    parseContainerViewPreferences(JSON.stringify({ view: "carousel", groupBy: "planet" })),
    defaultContainerViewPreferences
  );
});

test("normalizeContainerViewPreferences cleans hidden keys", () => {
  const normalized = normalizeContainerViewPreferences({
    view: "grid",
    groupBy: "status",
    hidden: ["  nas::redis  ", "nas::redis", "", 42, null],
  });

  assert.deepEqual(normalized, { view: "grid", groupBy: "status", hidden: ["nas::redis"] });
});

test("normalizeContainerViewPreferences bounds the hidden list", () => {
  const hidden = Array.from({ length: maxHiddenContainers + 25 }, (_, index) => `nas::app-${index}`);
  const normalized = normalizeContainerViewPreferences({ hidden });

  assert.equal(normalized.hidden.length, maxHiddenContainers);
});

test("toggleHiddenContainer adds and removes keys", () => {
  assert.deepEqual(toggleHiddenContainer([], "nas::redis"), ["nas::redis"]);
  assert.deepEqual(toggleHiddenContainer(["nas::redis"], "nas::redis"), []);
  assert.deepEqual(toggleHiddenContainer(["nas::redis"], "  "), ["nas::redis"]);
});

test("serializeContainerViewPreferences round-trips through parse", () => {
  const value: ContainerViewPreferences = {
    view: "tiles",
    groupBy: "provider",
    hidden: ["nas::redis"],
  };

  assert.deepEqual(parseContainerViewPreferences(serializeContainerViewPreferences(value)), value);
});
