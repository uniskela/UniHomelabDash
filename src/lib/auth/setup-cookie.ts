import { cookies } from "next/headers";
import { createSetupToken, getSetupCookieOptions, verifySetupToken } from "@/lib/auth/session";
import { isSetupComplete } from "@/lib/settings/store";

export async function ensureSetupCookie() {
  if (!isSetupComplete()) {
    return;
  }

  const cookieStore = await cookies();
  const existing = cookieStore.get(getSetupCookieOptions().name)?.value;
  if (existing && (await verifySetupToken(existing))) {
    return;
  }

  const token = await createSetupToken();
  cookieStore.set(getSetupCookieOptions().name, token, getSetupCookieOptions());
}
