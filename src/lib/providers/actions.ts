"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import type { DockerConnectionMode } from "@/lib/providers/docker/config";
import {
  getProviderRowById,
  getProviderRowByType,
  listProviderDefinitions,
  rowToPublicView,
  toProviderRow,
} from "@/lib/providers/registry";
import { executeProviderAction, testProviderConnection } from "@/lib/providers/runtime";
import {
  createDockerProvider,
  createPortainerProvider,
  deleteProviderById,
  listProvidersByType,
  upsertPortainerProvider,
  upsertDockerProvider,
} from "@/lib/providers/store";
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

export async function getDockerProvidersAction(): Promise<ProviderPublicView[]> {
  await requireAuth();
  return listProvidersByType("docker").map((row) => rowToPublicView(toProviderRow(row)));
}

export async function getPortainerProvidersAction(): Promise<ProviderPublicView[]> {
  await requireAuth();
  return listProvidersByType("portainer").map((row) => rowToPublicView(toProviderRow(row)));
}

function parseConnectionMode(value: FormDataEntryValue | null): DockerConnectionMode {
  const mode = String(value ?? "local");
  return mode === "tcp" || mode === "tls" ? mode : "local";
}

export async function createDockerProviderAction() {
  try {
    await requireAuth();
  } catch {
    return;
  }

  createDockerProvider("Docker");
  revalidateProviderPaths();
}

export async function createPortainerProviderAction() {
  try {
    await requireAuth();
  } catch {
    return;
  }

  createPortainerProvider("Portainer");
  revalidateProviderPaths();
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

  const providerId = String(formData.get("providerId") ?? "").trim() || undefined;
  const name = String(formData.get("name") ?? "Docker").trim();
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

  if (!name) {
    return { ok: false, message: "Integration name is required." };
  }

  if (mode === "local" && !socketPath) {
    return { ok: false, message: "Socket path is required for local Docker connections." };
  }

  if (mode !== "local" && !host) {
    return { ok: false, message: "Host is required for remote Docker connections." };
  }

  if (providerId) {
    const existing = getProviderRowById(providerId);
    if (!existing || existing.type !== "docker") {
      return { ok: false, message: "Docker integration not found." };
    }
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
    id: providerId,
    name,
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

  revalidateProviderPaths();

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
  try {
    await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: error.message };
    }
    throw error;
  }

  const providerId = String(formData.get("providerId") ?? "").trim();
  const row = providerId ? getProviderRowById(providerId) : getProviderRowByType("docker");
  if (!row || row.type !== "docker") {
    return { ok: false, message: "Enable Docker integration in Settings first." };
  }

  const result = await testProviderConnection(row.id);
  revalidateProviderPaths();

  return {
    ok: result.ok,
    message: result.message,
  };
}

export async function configurePortainerProviderAction(
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

  const providerId = String(formData.get("providerId") ?? "").trim() || undefined;
  const name = String(formData.get("name") ?? "Portainer").trim();
  const enabled = formData.get("enabled") === "on" || formData.get("enabled") === "true";
  const baseUrl = String(formData.get("baseUrl") ?? "").trim().replace(/\/+$/, "");
  const apiKey = String(formData.get("apiKey") ?? "").trim();
  const caCert = String(formData.get("caCert") ?? "").trim();
  const clearToken = formData.get("clearToken") === "on" || formData.get("clearToken") === "true";

  if (!name) {
    return { ok: false, message: "Integration name is required." };
  }

  if (providerId) {
    const existing = getProviderRowById(providerId);
    if (!existing || existing.type !== "portainer") {
      return { ok: false, message: "Portainer integration not found." };
    }
  }

  const credentials =
    apiKey || caCert
      ? {
          ...(apiKey ? { portainerApiKey: apiKey } : {}),
          ...(caCert ? { portainerCaCert: caCert } : {}),
        }
      : undefined;

  upsertPortainerProvider({
    id: providerId,
    name,
    enabled,
    config: { baseUrl },
    credentials,
    preserveCredentials: !(clearToken || credentials),
  });

  revalidateProviderPaths();
  return {
    ok: true,
    message: enabled
      ? "Portainer integration saved. Test the connection to confirm access."
      : "Portainer integration disabled.",
  };
}

export async function testPortainerProviderAction(
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

  const providerId = String(formData.get("providerId") ?? "").trim();
  const row = providerId ? getProviderRowById(providerId) : null;
  if (!row || row.type !== "portainer") {
    return { ok: false, message: "Enable Portainer integration in Settings first." };
  }

  const result = await testProviderConnection(row.id);
  revalidateProviderPaths();

  return {
    ok: result.ok,
    message: result.message,
  };
}

export async function deleteDockerProviderAction(formData: FormData) {
  try {
    await requireAuth();
  } catch {
    return;
  }

  const providerId = String(formData.get("providerId") ?? "").trim();
  const row = providerId ? getProviderRowById(providerId) : null;
  if (!row || row.type !== "docker") {
    return;
  }

  deleteProviderById(providerId);
  revalidateProviderPaths();
}

export async function deletePortainerProviderAction(formData: FormData) {
  try {
    await requireAuth();
  } catch {
    return;
  }

  const providerId = String(formData.get("providerId") ?? "").trim();
  const row = providerId ? getProviderRowById(providerId) : null;
  if (!row || row.type !== "portainer") {
    return;
  }

  deleteProviderById(providerId);
  revalidateProviderPaths();
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
  const providerId = String(formData.get("providerId") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();

  if (!containerId || !providerId || !["start", "stop", "restart"].includes(action)) {
    return { ok: false, message: "Invalid container action request." };
  }

  const result = await executeProviderAction("docker", action, containerId, providerId);
  revalidatePath("/containers");

  return {
    ok: result.ok,
    message: result.message,
  };
}

function revalidateProviderPaths() {
  revalidatePath("/settings");
  revalidatePath("/containers");
}
