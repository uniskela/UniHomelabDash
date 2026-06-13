import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { isAuthDisabled } from "@/lib/auth/constants";
import { getSessionCookieOptions, verifySessionToken } from "@/lib/auth/session";
import { AuthError, type SessionUser } from "@/lib/auth/types";

export async function getSessionUser(): Promise<SessionUser | null> {
  if (isAuthDisabled()) {
    return { id: "dev", username: "dev" };
  }

  const cookieStore = await cookies();
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
