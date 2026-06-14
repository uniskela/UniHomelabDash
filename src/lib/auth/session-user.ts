import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { isAuthDisabled, SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getSessionCookieOptions, verifySessionToken } from "@/lib/auth/session";
import { validateSessionFromCookieHeader } from "@/lib/auth/validate-session";
import { AuthError, type SessionUser } from "@/lib/auth/types";

function formatCookieHeader(
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) {
    return "";
  }

  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(session)}`;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (isAuthDisabled()) {
    return { id: "dev", username: "dev" };
  }

  const cookieStore = await cookies();
  const validation = await validateSessionFromCookieHeader(formatCookieHeader(cookieStore));
  if (!validation.ok) {
    return null;
  }

  const token = cookieStore.get(getSessionCookieOptions().name)?.value;
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return null;
  }

  const [user] = getDb().select().from(users).where(eq(users.id, payload.userId)).limit(1).all();
  if (!user) {
    return null;
  }

  return { id: user.id, username: user.username };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("Authentication required.");
  }
  return user;
}
