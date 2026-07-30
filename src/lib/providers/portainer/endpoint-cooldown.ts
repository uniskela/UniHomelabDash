type CooldownEntry = {
  failedAt: number;
  message: string;
};

const cooldownByEndpoint = new Map<string, CooldownEntry>();

export function getPortainerEndpointCooldownMs() {
  const configured = Number.parseInt(process.env.UH_PORTAINER_ENDPOINT_COOLDOWN_MS ?? "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 120_000;
}

export function endpointCooldownKey(providerId: string, endpointId: number) {
  return `${providerId}:${endpointId}`;
}

export function getEndpointCooldown(providerId: string, endpointId: number, now = Date.now()) {
  const key = endpointCooldownKey(providerId, endpointId);
  const entry = cooldownByEndpoint.get(key);
  if (!entry) {
    return null;
  }

  if (now - entry.failedAt >= getPortainerEndpointCooldownMs()) {
    cooldownByEndpoint.delete(key);
    return null;
  }

  return entry;
}

export function markEndpointFailure(
  providerId: string,
  endpointId: number,
  message: string,
  now = Date.now()
) {
  cooldownByEndpoint.set(endpointCooldownKey(providerId, endpointId), {
    failedAt: now,
    message,
  });
}

export function clearEndpointFailure(providerId: string, endpointId: number) {
  cooldownByEndpoint.delete(endpointCooldownKey(providerId, endpointId));
}

export function clearAllEndpointCooldowns() {
  cooldownByEndpoint.clear();
}
