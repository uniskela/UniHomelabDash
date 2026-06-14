import { eq } from "drizzle-orm";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  getClearSessionCookieOptions,
  getClearSetupCookieOptions,
  verifySessionToken,
} from "@/lib/auth/session";
import { isSetupComplete } from "@/lib/settings/store";

export type SessionValidationResult =
  | { ok: true }
  | { ok: false; redirectTo: "/setup" | "/login" };

function getCookieValue(cookieHeader: string, name: string) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function validateSessionFromCookieHeader(
  cookieHeader: string | null | undefined
): Promise<SessionValidationResult> {
  const setupComplete = isSetupComplete();
  const redirectTo = setupComplete ? "/login" : "/setup";

  const sessionToken = getCookieValue(cookieHeader ?? "", SESSION_COOKIE_NAME);
  if (!sessionToken) {
    return { ok: false, redirectTo };
  }

  const payload = await verifySessionToken(sessionToken);
  if (!payload) {
    return { ok: false, redirectTo };
  }

  const [user] = getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1)
    .all();

  if (!user) {
    return { ok: false, redirectTo };
  }

  if (!setupComplete) {
    return { ok: false, redirectTo: "/setup" };
  }

  return { ok: true };
}

export function appendClearAuthCookies(response: Response) {
  response.headers.append(
    "Set-Cookie",
    serializeClearCookie(getClearSessionCookieOptions())
  );
  response.headers.append("Set-Cookie", serializeClearCookie(getClearSetupCookieOptions()));
}

function serializeClearCookie(options: {
  name: string;
  value?: string;
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
}) {
  const parts = [
    `${options.name}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}
