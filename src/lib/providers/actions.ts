"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import type { DockerConnectionMode } from "@/lib/providers/docker/config";
import {
  getProviderRowByType,
  listProviderDefinitions,
  rowToPublicView,
  toProviderRow,
} from "@/lib/providers/registry";
import { executeProviderAction, testProviderConnection } from "@/lib/providers/runtime";
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

function parseConnectionMode(value: FormDataEntryValue | null): DockerConnectionMode {
  const mode = String(value ?? "local");
  return mode === "tcp" || mode === "tls" ? mode : "local";
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
  const allowActions =
    formData.get("allowActions") === "on" || formData.get("allowActions") === "true";
  const mode = parseConnectionMode(formData.get("connectionMode"));
  const socketPath = String(formData.get("socketPath") ?? "/var/run/docker.sock").trim();
  const host = String(formData.get("host") ?? "127.0.0.1").trim();
  const port = Number.parseInt(String(formData.get("port") ?? ""), 10);
  const tlsCa = String(formData.get("tlsCa") ?? "").trim();
  const tlsCert = String(formData.get("tlsCert") ?? "").trim();
  const tlsKey = String(formData.get("tlsKey") ?? "").trim();

  if (mode === "local" && !socketPath) {
    return { ok: false, message: "Socket path is required for local Docker connections." };
  }

  if (mode !== "local" && !host) {
    return { ok: false, message: "Host is required for remote Docker connections." };
  }

  const credentials =
    tlsCa || tlsCert || tlsKey
      ? {
          ...(tlsCa ? { tlsCa } : {}),
          ...(tlsCert ? { tlsCert } : {}),
          ...(tlsKey ? { tlsKey } : {}),
        }
      : undefined;

  upsertDockerProvider({
    enabled,
    readOnly: !allowActions,
    config: {
      mode,
      socketPath,
      host,
      port: Number.isFinite(port) ? port : mode === "tls" ? 2376 : 2375,
    },
    credentials: mode === "tls" ? credentials : undefined,
    preserveCredentials: mode === "tls" && !credentials,
  });

  revalidatePath("/settings");
  revalidatePath("/containers");

  return {
    ok: true,
    message: enabled
      ? "Docker integration saved. Test the connection to confirm access."
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

export async function executeContainerAction(
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

  const containerId = String(formData.get("containerId") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();

  if (!containerId || !["start", "stop", "restart"].includes(action)) {
    return { ok: false, message: "Invalid container action request." };
  }

  const result = await executeProviderAction("docker", action, containerId);
  revalidatePath("/containers");

  return {
    ok: result.ok,
    message: result.message,
  };
}
