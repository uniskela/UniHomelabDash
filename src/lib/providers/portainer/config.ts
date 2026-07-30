export type PortainerProviderConfig = {
  baseUrl: string;
};

export type PortainerCredentials = {
  apiKey?: string;
  caCert?: string;
};

export function normalizePortainerBaseUrl(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\/+$/, "");
}

export function parsePortainerConfig(config: Record<string, unknown>): PortainerProviderConfig {
  return {
    baseUrl: normalizePortainerBaseUrl(config.baseUrl),
  };
}

export function parsePortainerCredentials(
  credentials: Record<string, string>
): PortainerCredentials {
  return {
    apiKey: credentials.portainerApiKey?.trim() || undefined,
    caCert: credentials.portainerCaCert?.trim() || undefined,
  };
}

export function validatePortainerConfig(
  config: PortainerProviderConfig,
  credentials: PortainerCredentials
): string | null {
  if (!config.baseUrl) {
    return "Portainer base URL is required.";
  }

  let parsed: URL;
  try {
    parsed = new URL(config.baseUrl);
  } catch {
    return "Portainer base URL must be a valid URL.";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Portainer base URL must use http:// or https://.";
  }

  if (parsed.username || parsed.password) {
    return "Portainer base URL must not include embedded credentials.";
  }

  if (!credentials.apiKey) {
    return "Portainer access token is required.";
  }

  return null;
}
