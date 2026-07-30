import assert from "node:assert/strict";
import test from "node:test";
import {
  clearAllEndpointCooldowns,
  clearEndpointFailure,
  getEndpointCooldown,
  markEndpointFailure,
} from "./endpoint-cooldown";

test("endpoint cooldown skips failures until expiry and clears on success", () => {
  clearAllEndpointCooldowns();
  const now = Date.now();

  markEndpointFailure("provider-1", 7, "connection refused", now);
  assert.equal(getEndpointCooldown("provider-1", 7, now)?.message, "connection refused");
  assert.equal(getEndpointCooldown("provider-1", 7, now + 60_000)?.message, "connection refused");
  assert.equal(getEndpointCooldown("provider-1", 7, now + 120_000), null);

  markEndpointFailure("provider-1", 7, "timed out", now);
  clearEndpointFailure("provider-1", 7);
  assert.equal(getEndpointCooldown("provider-1", 7, now), null);
});
