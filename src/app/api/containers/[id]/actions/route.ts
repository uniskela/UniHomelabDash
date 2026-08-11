import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import {
  executeProviderAction,
  invalidateContainerDetailCache,
  invalidateContainerListCache,
} from "@/lib/providers/runtime";
import { getProviderRowById } from "@/lib/providers/registry";
import type { ProviderType } from "@/lib/providers/types";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<Record<string, string | string[] | undefined>> }
) {
  try {
    await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const params = await context.params;
  const id = typeof params.id === "string" ? params.id : "";
  if (!id.trim()) {
    return NextResponse.json({ error: "Container ID is required." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | { action?: unknown; providerId?: unknown }
    | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const providerId = typeof body?.providerId === "string" ? body.providerId.trim() : "";

  if (!action || !["start", "stop", "restart"].includes(action)) {
    return NextResponse.json({ error: "action must be start, stop, or restart." }, { status: 400 });
  }

  if (!providerId) {
    return NextResponse.json({ error: "providerId is required." }, { status: 400 });
  }

  const row = getProviderRowById(providerId);
  if (!row || (row.type !== "docker" && row.type !== "portainer")) {
    return NextResponse.json(
      { ok: false, message: "Provider is not configured or enabled." },
      { status: 400 }
    );
  }

  const result = await executeProviderAction(
    row.type as ProviderType,
    action,
    id,
    providerId
  );

  if (result.ok) {
    invalidateContainerListCache();
    invalidateContainerDetailCache(providerId, id);
  }

  return NextResponse.json(
    { ok: result.ok, message: result.message },
    { status: result.ok ? 200 : 502 }
  );
}
