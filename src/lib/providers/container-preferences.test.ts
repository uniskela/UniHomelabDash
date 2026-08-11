import assert from "node:assert/strict";
import test from "node:test";
import {
  BUILTIN_VIEW_IDS,
  defaultContainerViewPreferences,
  maxHiddenContainers,
  maxUserViews,
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

test("parseContainerViewPreferences upgrades legacy layout prefs", () => {
  const parsed = parseContainerViewPreferences(
    JSON.stringify({ view: "tiles", groupBy: "host", hidden: ["nas::redis"] })
  );

  assert.equal(parsed.version, 1);
  assert.deepEqual(parsed.hidden, ["nas::redis"]);
  assert.equal(parsed.views.length, 1);
  assert.equal(parsed.views[0]?.view, "tiles");
  assert.equal(parsed.views[0]?.groupBy, "host");
  assert.equal(parsed.activeViewId, parsed.views[0]?.id);
});

test("parseContainerViewPreferences keeps default layout on legacy unknown values", () => {
  assert.deepEqual(
    parseContainerViewPreferences(JSON.stringify({ view: "carousel", groupBy: "planet" })),
    defaultContainerViewPreferences
  );
});

test("normalizeContainerViewPreferences cleans hidden keys", () => {
  const normalized = normalizeContainerViewPreferences({
    version: 1,
    activeViewId: BUILTIN_VIEW_IDS.all,
    views: [],
    hidden: ["  nas::redis  ", "nas::redis", "", 42, null],
  });

  assert.deepEqual(normalized.hidden, ["nas::redis"]);
  assert.equal(normalized.activeViewId, BUILTIN_VIEW_IDS.all);
});

test("normalizeContainerViewPreferences bounds the hidden list", () => {
  const hidden = Array.from({ length: maxHiddenContainers + 25 }, (_, index) => `nas::app-${index}`);
  const normalized = normalizeContainerViewPreferences({ hidden });

  assert.equal(normalized.hidden.length, maxHiddenContainers);
});

test("normalizeContainerViewPreferences bounds user views and rejects duplicate names", () => {
  const views = Array.from({ length: maxUserViews + 5 }, (_, index) => ({
    id: `view-${index}`,
    name: index < 2 ? "Dup" : `View ${index}`,
    search: "",
    status: "all",
    host: "",
    provider: "",
    sortField: "name",
    sortDirection: "asc",
    groupBy: "none",
    view: "list",
    density: "comfortable",
    visibleFields: ["image"],
  }));

  const normalized = normalizeContainerViewPreferences({
    version: 1,
    activeViewId: "view-0",
    views,
    hidden: [],
  });

  assert.ok(normalized.views.length <= maxUserViews);
  assert.equal(
    normalized.views.filter((view) => view.name.toLowerCase() === "dup").length,
    1
  );
});

test("toggleHiddenContainer adds and removes keys", () => {
  assert.deepEqual(toggleHiddenContainer([], "nas::redis"), ["nas::redis"]);
  assert.deepEqual(toggleHiddenContainer(["nas::redis"], "nas::redis"), []);
  assert.deepEqual(toggleHiddenContainer(["nas::redis"], "  "), ["nas::redis"]);
});

test("serializeContainerViewPreferences round-trips through parse", () => {
  const value: ContainerViewPreferences = {
    version: 1,
    activeViewId: BUILTIN_VIEW_IDS.running,
    views: [
      {
        id: "view_abc",
        name: "Prod",
        search: "host:nas",
        status: "running",
        host: "nas",
        provider: "",
        sortField: "name",
        sortDirection: "asc",
        groupBy: "host",
        view: "tiles",
        density: "compact",
        visibleFields: ["image", "host"],
      },
    ],
    hidden: ["nas::redis"],
  };

  assert.deepEqual(parseContainerViewPreferences(serializeContainerViewPreferences(value)), value);
});
