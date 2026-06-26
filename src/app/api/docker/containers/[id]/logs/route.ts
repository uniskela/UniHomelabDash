import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import { getProviderLogs } from "@/lib/providers/runtime";

export const runtime = "nodejs";

const DEFAULT_TAIL = 200;
const MAX_TAIL = 500;

function parseTail(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_TAIL;
  }
  return Math.min(Math.max(parsed, 1), MAX_TAIL);
}

function parseTimestamps(value: string | null) {
  if (value === "0" || value === "false") {
    return false;
  }
  return true;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const { id } = await context.params;
  const url = new URL(request.url);
  const tail = parseTail(url.searchParams.get("tail"));
  const timestamps = parseTimestamps(url.searchParams.get("timestamps"));
  const providerId = url.searchParams.get("providerId")?.trim() || undefined;
  const result = await getProviderLogs("docker", id, { tail, timestamps }, providerId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message ?? "Failed to load container logs." },
      { status: 502 }
    );
  }

  return NextResponse.json({ logs: result.logs, tail });
}
