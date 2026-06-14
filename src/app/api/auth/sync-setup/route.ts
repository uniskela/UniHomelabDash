import { NextResponse } from "next/server";
import { ensureSetupCookie } from "@/lib/auth/setup-cookie";
import { isAuthDisabled } from "@/lib/auth/constants";
import { getClearSetupCookieOptions } from "@/lib/auth/session";
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

  return NextResponse.redirect(redirectUrlFromRequest(request, "/login"));
}
