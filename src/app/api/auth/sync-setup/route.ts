import { NextResponse } from "next/server";
import { ensureSetupCookie } from "@/lib/auth/setup-cookie";
import { isAuthDisabled } from "@/lib/auth/constants";
import { redirectUrlFromRequest } from "@/lib/request/redirect";
import { isSetupComplete } from "@/lib/settings/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (isAuthDisabled()) {
    return NextResponse.redirect(redirectUrlFromRequest(request, "/"));
  }

  if (!isSetupComplete()) {
    return NextResponse.redirect(redirectUrlFromRequest(request, "/setup"));
  }

  await ensureSetupCookie();

  return NextResponse.redirect(redirectUrlFromRequest(request, "/login"));
}
