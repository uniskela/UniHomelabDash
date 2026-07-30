import {
  containerHostLabel,
  containerLabelPairs,
  containerProviderLabel,
  containerSearchHaystack,
  isRunningContainer,
  isStoppedContainer,
} from "@/lib/providers/container-fields";
import type { ProviderResource } from "@/lib/providers/types";

export type ContainerQueryField =
  | "text"
  | "name"
  | "image"
  | "host"
  | "status"
  | "port"
  | "id"
  | "label"
  | "provider";

export type ContainerQueryTerm = {
  field: ContainerQueryField;
  value: string;
  negated: boolean;
};

/** Accepted search prefixes, including short aliases. */
const fieldAliases: Record<string, ContainerQueryField> = {
  name: "name",
  n: "name",
  container: "name",
  image: "image",
  img: "image",
  i: "image",
  host: "host",
  h: "host",
  endpoint: "host",
  node: "host",
  status: "status",
  state: "status",
  s: "status",
  port: "port",
  ports: "port",
  p: "port",
  id: "id",
  label: "label",
  labels: "label",
  provider: "provider",
};

/** Prefixes offered in the UI hint, in display order. */
export const containerQueryPrefixes = [
  "name:",
  "image:",
  "host:",
  "status:",
  "port:",
  "label:",
  "provider:",
  "id:",
] as const;

// Keeps quoted values together so `name:"my app"` stays a single token.
const tokenPattern = /(?:[^\s"]+|"[^"]*")+/g;

export function parseContainerQuery(query: string): ContainerQueryTerm[] {
  const tokens = query.match(tokenPattern) ?? [];
  const terms: ContainerQueryTerm[] = [];

  for (const token of tokens) {
    const negated = token.startsWith("-") || token.startsWith("!");
    const body = negated ? token.slice(1) : token;

    if (!body) {
      continue;
    }

    const colonIndex = body.indexOf(":");
    const field = colonIndex > 0 ? fieldAliases[body.slice(0, colonIndex).toLowerCase()] : undefined;
    const value = unquote(field ? body.slice(colonIndex + 1) : body);

    // Ignore terms that carry no value yet, so a half-typed `host:` still
    // shows every container instead of nothing.
    if (!value) {
      continue;
    }

    terms.push({ field: field ?? "text", value, negated });
  }

  return terms;
}

export function matchesContainerQuery(
  container: ProviderResource,
  terms: ContainerQueryTerm[]
) {
  return terms.every((term) => matchesTerm(container, term) !== term.negated);
}

function matchesTerm(container: ProviderResource, term: ContainerQueryTerm) {
  const value = term.value.toLowerCase();

  switch (term.field) {
    case "name":
      return includes(container.name, value);
    case "image":
      return includes(container.image, value);
    case "host":
      return includes(containerHostLabel(container), value);
    case "status":
      return matchesStatus(container, value);
    case "port":
      return (container.ports ?? []).some((port) => includes(port, value));
    case "id":
      return includes(container.id, value);
    case "label":
      return containerLabelPairs(container).some((pair) => includes(pair, value));
    case "provider":
      return (
        includes(containerProviderLabel(container), value) ||
        includes(container.providerType, value)
      );
    default:
      return containerSearchHaystack(container).includes(value);
  }
}

function matchesStatus(container: ProviderResource, value: string) {
  if (value === "running") {
    return isRunningContainer(container.status);
  }
  if (value === "stopped") {
    return isStoppedContainer(container.status);
  }

  return includes(container.status, value) || includes(container.summary, value);
}

function includes(haystack: string | undefined, needle: string) {
  return Boolean(haystack && haystack.toLowerCase().includes(needle));
}

function unquote(value: string) {
  const trimmed = value.trim();

  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed.replaceAll('"', "").trim();
}
