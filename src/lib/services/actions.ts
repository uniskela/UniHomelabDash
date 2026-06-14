"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import { getDb } from "@/lib/db/client";
import { services } from "@/lib/db/schema";
import { checkServiceHealth } from "@/lib/services/health";

export type ActionState = {
  ok: boolean;
  message: string;
};

export async function createServiceAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const parsed = parseServiceForm(formData);

  if (!parsed.ok) {
    return { ok: false, message: parsed.message };
  }

  const now = new Date().toISOString();

  getDb()
    .insert(services)
    .values({
      id: crypto.randomUUID(),
      ...parsed.service,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  revalidateServices();

  return { ok: true, message: "Service created." };
}

export async function updateServiceAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const id = readField(formData, "id");
  const parsed = parseServiceForm(formData);

  if (!id) {
    return { ok: false, message: "Missing service id." };
  }

  if (!parsed.ok) {
    return { ok: false, message: parsed.message };
  }

  const [existingService] = getDb()
    .select()
    .from(services)
    .where(eq(services.id, id))
    .limit(1)
    .all();
  const healthUrlChanged = existingService?.healthUrl !== parsed.service.healthUrl;

  getDb()
    .update(services)
    .set({
      ...parsed.service,
      ...(healthUrlChanged
        ? {
            healthStatus: "unknown" as const,
            healthErrorMessage: "",
            lastCheckedAt: null,
          }
        : {}),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(services.id, id))
    .run();

  revalidateServices();

  return { ok: true, message: "Service updated." };
}

export async function deleteServiceAction(formData: FormData) {
  try {
    await requireAuth();
  } catch {
    return;
  }

  const id = readField(formData, "id");

  if (!id) {
    return;
  }

  getDb().delete(services).where(eq(services.id, id)).run();
  revalidateServices();
}

export async function checkServiceHealthAction(formData: FormData) {
  try {
    await requireAuth();
  } catch {
    return;
  }

  const id = readField(formData, "id");

  if (!id) {
    return;
  }

  const [service] = getDb().select().from(services).where(eq(services.id, id)).limit(1).all();

  if (!service) {
    return;
  }

  const result = await checkServiceHealth(service.healthUrl);

  getDb()
    .update(services)
    .set({
      healthStatus: result.status,
      healthErrorMessage: result.errorMessage,
      lastCheckedAt: result.checkedAt,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(services.id, id))
    .run();

  revalidateServices();
}

export async function checkAllServiceHealthAction() {
  try {
    await requireAuth();
  } catch {
    return;
  }

  const servicesToCheck = getDb().select().from(services).all();

  for (const service of servicesToCheck) {
    if (!service.healthUrl) {
      continue;
    }

    const result = await checkServiceHealth(service.healthUrl);

    getDb()
      .update(services)
      .set({
        healthStatus: result.status,
        healthErrorMessage: result.errorMessage,
        lastCheckedAt: result.checkedAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(services.id, service.id))
      .run();
  }

  revalidateServices();
}

function parseServiceForm(formData: FormData):
  | {
      ok: true;
      service: {
        name: string;
        url: string;
        category: string;
        host: string;
        icon: string;
        notes: string;
        healthUrl: string;
      };
    }
  | { ok: false; message: string } {
  const name = readField(formData, "name");
  const url = readField(formData, "url");
  const category = readField(formData, "category") || "General";
  const host = readField(formData, "host");
  const icon = readField(formData, "icon");
  const notes = readField(formData, "notes");
  const healthUrl = readField(formData, "healthUrl");

  if (!name) {
    return { ok: false, message: "Name is required." };
  }

  if (!url || !isHttpUrl(url)) {
    return { ok: false, message: "Enter a valid http or https service URL." };
  }

  if (healthUrl && !isHttpUrl(healthUrl)) {
    return { ok: false, message: "Enter a valid http or https health check URL." };
  }

  return {
    ok: true,
    service: {
      name: limit(name, 80),
      url,
      category: limit(category, 50),
      host: limit(host, 80),
      icon: limit(icon, 8),
      notes: limit(notes, 500),
      healthUrl,
    },
  };
}

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function limit(value: string, length: number) {
  return value.slice(0, length);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function revalidateServices() {
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath("/settings");
}
