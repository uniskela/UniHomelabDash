import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureSetupCookie } from "@/lib/auth/setup-cookie";
import { isAuthDisabled, SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getClearSetupCookieOptions, verifySessionToken } from "@/lib/auth/session";
import { redirectUrlFromRequest } from "@/lib/request/redirect";
import { isSetupComplete } from "@/lib/settings/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (isAuthDisabled()) {
    return NextResponse.redirect(redirectUrlFromRequest(request, "/"));
  }

  if (!isSetupComplete()) {
    const response = NextResponse.redirect(redirectUrlFromRequest(request, "/setup"));
    response.cookies.set(
      getClearSetupCookieOptions().name,
      "",
      getClearSetupCookieOptions()
    );
    return response;
  }

  await ensureSetupCookie();

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken) : null;
  const destination = session ? "/" : "/login";

  return NextResponse.redirect(redirectUrlFromRequest(request, destination));
}
