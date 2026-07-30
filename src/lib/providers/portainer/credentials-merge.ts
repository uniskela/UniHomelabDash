/** Merge partial Portainer credential form updates into the stored blob. */
export function mergePortainerCredentialUpdates(input: {
  existing: Record<string, string>;
  apiKey: string;
  caCert: string;
  clearToken: boolean;
}): { credentials?: Record<string, string>; preserveCredentials: boolean } {
  const { existing, apiKey, caCert, clearToken } = input;

  if (!clearToken && !apiKey && !caCert) {
    return { credentials: undefined, preserveCredentials: true };
  }

  const next: Record<string, string> = { ...existing };

  if (clearToken) {
    delete next.portainerApiKey;
  }
  if (apiKey) {
    next.portainerApiKey = apiKey;
  }
  if (caCert) {
    next.portainerCaCert = caCert;
  }

  if (Object.keys(next).length === 0) {
    return { credentials: undefined, preserveCredentials: false };
  }

  return { credentials: next, preserveCredentials: false };
}
