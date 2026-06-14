"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { settings, users } from "@/lib/db/schema";
import { isAuthDisabled, MAX_USERNAME_LENGTH } from "@/lib/auth/constants";
import { hashPassword, passwordExceedsBcryptLimit, verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  createSetupToken,
  getClearSessionCookieOptions,
  getSessionCookieOptions,
  getSetupCookieOptions,
  verifySetupToken,
} from "@/lib/auth/session";
import { isSetupComplete } from "@/lib/settings/store";
import { SETTING_KEYS } from "@/lib/settings/keys";
import type { AuthActionState } from "@/lib/auth/types";

export async function setupAdminAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (isAuthDisabled()) {
    return { ok: false, message: "Setup is disabled while AUTH_DISABLED is true." };
  }

  if (isSetupComplete()) {
    return { ok: false, message: "Setup has already been completed." };
  }

  const username = readField(formData, "username");
  const password = readField(formData, "password");
  const confirmPassword = readField(formData, "confirmPassword");

  if (!username || username.length < 3) {
    return { ok: false, message: "Username must be at least 3 characters." };
  }

  if (username.length > MAX_USERNAME_LENGTH) {
    return { ok: false, message: "Username must be at most 50 characters." };
  }

  if (password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  if (passwordExceedsBcryptLimit(password)) {
    return { ok: false, message: "Password must be at most 72 bytes." };
  }

  if (password !== confirmPassword) {
    return { ok: false, message: "Passwords do not match." };
  }

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  try {
    getDb().transaction((tx) => {
      const existingUsers = tx.select({ id: users.id }).from(users).limit(1).all();
      if (existingUsers.length > 0) {
        throw new SetupConflictError("An admin account already exists.");
      }

      const [setupRow] = tx
        .select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, SETTING_KEYS.setupComplete))
        .limit(1)
        .all();

      if (setupRow?.value === "true") {
        throw new SetupConflictError("Setup has already been completed.");
      }

      tx.insert(users)
        .values({
          id: userId,
          username,
          passwordHash,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      tx.insert(settings)
        .values({
          key: SETTING_KEYS.setupComplete,
          value: "true",
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: "true", updatedAt: now },
        })
        .run();
    });
  } catch (error) {
    if (error instanceof SetupConflictError) {
      return { ok: false, message: error.message };
    }

    if (isUniqueConstraintError(error)) {
      return { ok: false, message: "An admin account already exists." };
    }

    throw error;
  }

  const cookieStore = await cookies();
  const sessionToken = await createSessionToken(userId);
  const setupToken = await createSetupToken();

  cookieStore.set(getSessionCookieOptions().name, sessionToken, getSessionCookieOptions());
  cookieStore.set(getSetupCookieOptions().name, setupToken, getSetupCookieOptions());

  return { ok: true, message: "Admin account created." };
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (isAuthDisabled()) {
    return { ok: true, message: "Authentication is disabled." };
  }

  if (!isSetupComplete()) {
    return { ok: false, message: "Complete setup before signing in." };
  }

  const username = readField(formData, "username");
  const password = readField(formData, "password");

  if (!username || !password) {
    return { ok: false, message: "Enter your username and password." };
  }

  if (passwordExceedsBcryptLimit(password)) {
    return { ok: false, message: "Password must be at most 72 bytes." };
  }

  const [user] = getDb().select().from(users).where(eq(users.username, username)).limit(1).all();
  if (!user) {
    return { ok: false, message: "Invalid username or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { ok: false, message: "Invalid username or password." };
  }

  const cookieStore = await cookies();
  const sessionToken = await createSessionToken(user.id);
  cookieStore.set(getSessionCookieOptions().name, sessionToken, getSessionCookieOptions());

  const existingSetup = cookieStore.get(getSetupCookieOptions().name)?.value;
  if (!existingSetup || !(await verifySetupToken(existingSetup))) {
    const setupToken = await createSetupToken();
    cookieStore.set(getSetupCookieOptions().name, setupToken, getSetupCookieOptions());
  }

  return { ok: true, message: "Signed in." };
}

export async function logoutAction() {
  if (isAuthDisabled()) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(
    getClearSessionCookieOptions().name,
    "",
    getClearSessionCookieOptions()
  );
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

class SetupConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SetupConflictError";
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}
