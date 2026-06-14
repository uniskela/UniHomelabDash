import { NextResponse } from "next/server";
import { isAuthDisabled } from "@/lib/auth/constants";
import {
  appendClearAuthCookies,
  validateSessionFromCookieHeader,
} from "@/lib/auth/validate-session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (isAuthDisabled()) {
    return new NextResponse(null, { status: 200 });
  }

  const result = await validateSessionFromCookieHeader(request.headers.get("cookie"));

  if (result.ok) {
    return new NextResponse(null, { status: 200 });
  }

  const response = NextResponse.json({ redirectTo: result.redirectTo }, { status: 401 });
  appendClearAuthCookies(response);
  return response;
}
