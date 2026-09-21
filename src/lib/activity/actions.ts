"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session-user";
import { updateAlertStatus } from "@/lib/activity/record";
import type { AlertStatus } from "@/lib/db/schema";

export async function updateAlertStatusAction(formData: FormData): Promise<void> {
  try {
    await requireAuth();
  } catch {
    return;
  }

  const alertId = String(formData.get("alertId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as AlertStatus;

  if (!alertId) {
    return;
  }

  if (!["open", "acknowledged", "resolved"].includes(status)) {
    return;
  }

  updateAlertStatus(alertId, status);
  revalidatePath("/alerts");
  revalidatePath("/");
}
