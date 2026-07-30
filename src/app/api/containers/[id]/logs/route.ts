import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import { getProviderLogs } from "@/lib/providers/runtime";
import type { ProviderType } from "@/lib/providers/types";

export const runtime = "nodejs";

const MAX_TAIL = 500;
const DEFAULT_TAIL = 200;

function parseTail(value: string | null) {
  if (!value) {
    return DEFAULT_TAIL;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_TAIL;
  }

  return Math.max(1, Math.min(MAX_TAIL, parsed));
}

function parseProviderType(value: string | null): ProviderType | null {
  if (value === "docker" || value === "portainer") {
    return value;
  }
  return null;
}

export async function GET(
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

  const url = new URL(request.url);
  const providerType = parseProviderType(url.searchParams.get("providerType"));
  if (!providerType) {
    return NextResponse.json({ error: "A valid providerType is required." }, { status: 400 });
  }

  const providerId = url.searchParams.get("providerId")?.trim() || undefined;
  const tail = parseTail(url.searchParams.get("tail"));
  const timestamps = url.searchParams.get("timestamps") !== "0";

  const result = await getProviderLogs(providerType, id, { tail, timestamps }, providerId);

  if (!result.ok) {
    return NextResponse.json({ error: result.message ?? "Failed to load logs." }, { status: 400 });
  }

  return NextResponse.json({ logs: result.logs });
}
