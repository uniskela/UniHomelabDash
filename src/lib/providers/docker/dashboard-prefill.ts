import type { ProviderResource } from "@/lib/providers/types";

export type ContainerServiceDefaults = {
  name: string;
  category: string;
  icon: string;
  host: string;
  notes: string;
  healthUrl: string;
};

const explicitHealthLabelKeys = [
  "unihomelabdash.health_url",
  "unihomelabdash.health-url",
  "unihomelabdash.healthUrl",
  "healthcheck.url",
  "health.url",
];

export function buildContainerServiceDefaults(
  container: ProviderResource
): ContainerServiceDefaults {
  const healthUrl = detectContainerHealthUrl(container) ?? "";

  return {
    name: container.name,
    category: "Containers",
    icon: iconFromName(container.name),
    host: providerName(container),
    notes: buildContainerNotes(container, healthUrl),
    healthUrl,
  };
}

export function detectContainerHealthUrl(container: ProviderResource) {
  return (
    findExplicitLabelUrl(container.labels) ??
    findTraefikHostUrl(container.labels) ??
    findPublishedPortUrl(container)
  );
}

function buildContainerNotes(container: ProviderResource, healthUrl: string) {
  const notes = [
    `Image: ${container.image ?? "unknown"}`,
    `Status: ${container.summary ?? container.status}`,
    `Container ID: ${container.id}`,
  ];

  if (container.meta?.providerName) {
    notes.push(`Docker integration: ${container.meta.providerName}`);
  }

  if (healthUrl) {
    notes.push(`Detected health URL: ${healthUrl}`);
  }

  return notes.join("\n");
}

function findExplicitLabelUrl(labels: ProviderResource["labels"]) {
  if (!labels) return null;

  for (const key of explicitHealthLabelKeys) {
    const direct = labels[key];
    if (direct && isHttpUrl(direct)) {
      return direct;
    }
  }

  return null;
}

function findTraefikHostUrl(labels: ProviderResource["labels"]) {
  if (!labels) return null;

  for (const [key, value] of Object.entries(labels)) {
    if (!key.startsWith("traefik.http.routers.") || !key.endsWith(".rule")) {
      continue;
    }

    const host = value.match(/Host\(`([^`]+)`\)/)?.[1] ?? value.match(/Host\("([^"]+)"\)/)?.[1];
    if (host) {
      return `https://${host}`;
    }
  }

  return null;
}

function findPublishedPortUrl(container: ProviderResource) {
  const host = container.meta?.providerHost?.trim();
  if (!host) return null;

  const port = findPublishedTcpPort(container.ports ?? []);
  if (!port) return null;

  const protocol = port === 443 ? "https" : "http";
  return `${protocol}://${formatUrlHost(host)}${port === 80 || port === 443 ? "" : `:${port}`}`;
}

function findPublishedTcpPort(ports: string[]) {
  const candidates = ports
    .map(parsePublishedTcpPort)
    .filter((port): port is number => Boolean(port));

  return candidates.find(isPreferredHttpPort) ?? candidates[0] ?? null;
}

function parsePublishedTcpPort(port: string) {
  if (!/\/tcp\b/i.test(port)) return null;

  const arrowMatch = port.match(/(?:^|:)(\d+)->[^/]+\/tcp\b/i);
  if (arrowMatch) {
    return parsePort(arrowMatch[1]);
  }

  const colonMatch = port.match(/^(\d+):\d+\/tcp\b/i);
  if (colonMatch) {
    return parsePort(colonMatch[1]);
  }

  return null;
}

function parsePort(value: string) {
  const port = Number.parseInt(value, 10);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
}

function isPreferredHttpPort(port: number) {
  return [80, 443, 3000, 5000, 8000, 8080, 8081, 8096, 8443, 9000].includes(port);
}

function formatUrlHost(host: string) {
  return host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
}

function providerName(container: ProviderResource) {
  return container.meta?.providerName || "Docker";
}

function iconFromName(name: string) {
  const letters = name.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase();
  return letters || "CT";
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
