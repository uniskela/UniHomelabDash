import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SETUP_COOKIE_NAME,
  isAuthDisabled,
  getSessionSecret,
} from "@/lib/auth/constants";
import { verifySessionToken, verifySetupToken } from "@/lib/auth/session";
import { redirectUrlFromRequest, redirectUrlWithSearch } from "@/lib/request/redirect";

const PUBLIC_PATHS = ["/login", "/setup"];

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-touch-icon") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/icon.svg"
  );
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  if (isAuthDisabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const secret = getSessionSecret();
  if (!secret && process.env.NODE_ENV === "production") {
    return new NextResponse("SESSION_SECRET is required in production.", { status: 500 });
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const setupToken = request.cookies.get(SETUP_COOKIE_NAME)?.value;

  const session = sessionToken && secret ? await verifySessionToken(sessionToken) : null;
  const setupComplete = setupToken && secret ? await verifySetupToken(setupToken) : false;

  if (session) {
    if (pathname === "/login" || pathname === "/setup") {
      return NextResponse.redirect(redirectUrlFromRequest(request, "/"));
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (pathname.startsWith("/login") && !setupComplete) {
      return NextResponse.redirect(redirectUrlFromRequest(request, "/setup"));
    }
    if (pathname.startsWith("/setup") && setupComplete) {
      return NextResponse.redirect(redirectUrlFromRequest(request, "/api/auth/sync-setup"));
    }
    return NextResponse.next();
  }

  if (!setupComplete) {
    return NextResponse.redirect(
      redirectUrlWithSearch(request, "/setup", { next: pathname })
    );
  }

  return NextResponse.redirect(
    redirectUrlWithSearch(request, "/login", { next: pathname })
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/auth/sync-setup).*)"],
};
