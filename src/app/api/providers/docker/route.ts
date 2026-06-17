import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import { getProviderRowByType, rowToPublicView, toProviderRow } from "@/lib/providers/registry";
import { upsertDockerProvider } from "@/lib/providers/store";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const row = getProviderRowByType("docker");
  return NextResponse.json({
    provider: row ? rowToPublicView(toProviderRow(row)) : null,
  });
}

export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const body = (await request.json().catch(() => null)) as {
    enabled?: boolean;
    socketPath?: string;
  } | null;

  if (!body || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled boolean is required." }, { status: 400 });
  }

  const socketPath =
    typeof body.socketPath === "string" && body.socketPath.trim()
      ? body.socketPath.trim()
      : "/var/run/docker.sock";

  const id = upsertDockerProvider({
    enabled: body.enabled,
    config: { socketPath },
  });

  const row = getProviderRowByType("docker");
  if (!row) {
    return NextResponse.json({ error: "Failed to save Docker provider." }, { status: 500 });
  }

  return NextResponse.json({
    id,
    provider: rowToPublicView(toProviderRow(row)),
  });
}
