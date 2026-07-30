import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePortainerBaseUrl,
  parsePortainerConfig,
  parsePortainerCredentials,
  validatePortainerConfig,
} from "./config";

test("normalizePortainerBaseUrl trims and strips trailing slash", () => {
  assert.equal(normalizePortainerBaseUrl(" https://portainer.local/ "), "https://portainer.local");
});

test("validatePortainerConfig enforces https/http url and token", () => {
  const config = parsePortainerConfig({ baseUrl: "https://portainer.local" });
  const credentials = parsePortainerCredentials({ portainerApiKey: "" });
  assert.equal(
    validatePortainerConfig(config, credentials),
    "Portainer access token is required."
  );
});

test("validatePortainerConfig rejects embedded credentials", () => {
  const config = parsePortainerConfig({ baseUrl: "https://user:pass@portainer.local" });
  const credentials = parsePortainerCredentials({ portainerApiKey: "token" });
  assert.equal(
    validatePortainerConfig(config, credentials),
    "Portainer base URL must not include embedded credentials."
  );
});
