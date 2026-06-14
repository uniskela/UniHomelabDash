import type { NextRequest } from "next/server";

function safePathname(pathname: string) {
  if (pathname.startsWith("/") && !pathname.startsWith("//") && !pathname.includes(":")) {
    return pathname;
  }

  return "/";
}

function isValidHostHeader(host: string) {
  if (!host || host.length > 253) {
    return false;
  }

  if (/[\s/\\@]/.test(host)) {
    return false;
  }

  return /^[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(host);
}

function parseAllowedHosts() {
  const configured = process.env.ALLOWED_HOSTS;
  if (!configured) {
    return [];
  }

  return configured
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedHost(host: string) {
  const normalizedHost = host.toLowerCase();
  const hostWithoutPort = normalizedHost.split(":")[0] ?? normalizedHost;
  const allowedHosts = parseAllowedHosts();

  return allowedHosts.some(
    (allowed) => allowed === normalizedHost || allowed === hostWithoutPort
  );
}

function getConfiguredPublicOrigin() {
  const publicUrl = process.env.PUBLIC_URL;
  if (!publicUrl) {
    return null;
  }

  try {
    const url = new URL(publicUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

const UNSAFE_BROWSER_HOSTS = new Set(["0.0.0.0"]);

function normalizeBrowserHostname(hostname: string) {
  return UNSAFE_BROWSER_HOSTS.has(hostname) ? "localhost" : hostname;
}

function normalizeRedirectUrl(url: URL) {
  if (!UNSAFE_BROWSER_HOSTS.has(url.hostname)) {
    return url;
  }

  const normalized = new URL(url);
  normalized.hostname = normalizeBrowserHostname(url.hostname);
  return normalized;
}

function getTrustedProxyOrigin(request: Request | NextRequest) {
  if (process.env.TRUST_PROXY_HEADERS !== "true") {
    return null;
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (!forwardedHost || !isValidHostHeader(forwardedHost) || !isAllowedHost(forwardedHost)) {
    return null;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto === "https" ? "https" : "http";

  return `${proto}://${forwardedHost}`;
}

export function redirectUrlFromRequest(request: Request | NextRequest, pathname: string) {
  const safePath = safePathname(pathname);
  const configuredOrigin = getConfiguredPublicOrigin();
  if (configuredOrigin) {
    return new URL(safePath, configuredOrigin);
  }

  const trustedProxyOrigin = getTrustedProxyOrigin(request);
  if (trustedProxyOrigin) {
    return normalizeRedirectUrl(new URL(safePath, trustedProxyOrigin));
  }

  if ("nextUrl" in request) {
    const url = request.nextUrl.clone();
    url.pathname = safePath;
    url.search = "";
    return normalizeRedirectUrl(url);
  }

  return normalizeRedirectUrl(new URL(safePath, request.url));
}

export function redirectUrlWithSearch(
  request: NextRequest,
  pathname: string,
  searchParams: Record<string, string>
) {
  const url = redirectUrlFromRequest(request, pathname);
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }
  return url;
}
