"use server";

import { requireAuth } from "@/lib/auth/session-user";
import { AuthError } from "@/lib/auth/types";
import { normalizeContainerViewPreferences } from "@/lib/providers/container-preferences";
import { writeContainerViewPreferences } from "@/lib/providers/container-preferences-store";

export async function saveContainerViewPreferencesAction(
  input: unknown
): Promise<{ ok: boolean; message: string }> {
  try {
    await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  try {
    writeContainerViewPreferences(normalizeContainerViewPreferences(input));
  } catch {
    return { ok: false, message: "Could not save view preferences." };
  }

  return { ok: true, message: "View preferences saved." };
}
