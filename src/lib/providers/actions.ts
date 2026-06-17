"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import {
  getProviderRowByType,
  listProviderDefinitions,
  rowToPublicView,
  toProviderRow,
} from "@/lib/providers/registry";
import { testProviderConnection } from "@/lib/providers/runtime";
import { upsertDockerProvider } from "@/lib/providers/store";
import type { ProviderPublicView } from "@/lib/providers/types";
import type { ProviderActionState } from "@/lib/providers/action-state";

export async function getProviderDefinitionsAction() {
  await requireAuth();
  return listProviderDefinitions();
}

export async function getDockerProviderAction(): Promise<ProviderPublicView | null> {
  await requireAuth();
  const row = getProviderRowByType("docker");
  return row ? rowToPublicView(toProviderRow(row)) : null;
}

export async function configureDockerProviderAction(
  _previousState: ProviderActionState,
  formData: FormData
): Promise<ProviderActionState> {
  try {
    await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const enabled = formData.get("enabled") === "on" || formData.get("enabled") === "true";
  const socketPath = String(formData.get("socketPath") ?? "/var/run/docker.sock").trim();

  if (!socketPath) {
    return { ok: false, message: "Socket path is required." };
  }

  upsertDockerProvider({
    enabled,
    config: { socketPath },
  });

  revalidatePath("/settings");
  revalidatePath("/containers");

  return {
    ok: true,
    message: enabled
      ? "Docker integration enabled. Test the connection to confirm access."
      : "Docker integration disabled.",
  };
}

export async function testDockerProviderAction(
  _previousState: ProviderActionState,
  formData: FormData
): Promise<ProviderActionState> {
  void formData;
  try {
    await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const row = getProviderRowByType("docker");
  if (!row) {
    return { ok: false, message: "Enable Docker integration in Settings first." };
  }

  const result = await testProviderConnection(row.id);
  revalidatePath("/settings");
  revalidatePath("/containers");

  return {
    ok: result.ok,
    message: result.message,
  };
}
