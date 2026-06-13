import type { NextRequest } from "next/server";

export function redirectUrlFromRequest(request: Request | NextRequest, pathname: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";

  if (host) {
    return new URL(pathname, `${proto}://${host}`);
  }

  if ("nextUrl" in request) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    return url;
  }

  return new URL(pathname, request.url);
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
