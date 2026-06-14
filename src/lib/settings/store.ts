import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { SETTING_KEYS, type SettingKey } from "@/lib/settings/keys";

export function getSetting(key: SettingKey): string | null {
  const [row] = getDb().select().from(settings).where(eq(settings.key, key)).limit(1).all();
  return row?.value ?? null;
}

export function setSetting(key: SettingKey, value: string) {
  const now = new Date().toISOString();
  const existing = getSetting(key);

  if (existing === null) {
    getDb()
      .insert(settings)
      .values({ key, value, updatedAt: now })
      .run();
    return;
  }

  getDb()
    .update(settings)
    .set({ value, updatedAt: now })
    .where(eq(settings.key, key))
    .run();
}

export function isSetupComplete(): boolean {
  return getSetting(SETTING_KEYS.setupComplete) === "true";
}

export function markSetupComplete() {
  setSetting(SETTING_KEYS.setupComplete, "true");
}
