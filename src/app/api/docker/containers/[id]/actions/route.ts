import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import { executeProviderAction } from "@/lib/providers/runtime";

export const runtime = "nodejs";

export async function POST(
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
  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  const action = body?.action;

  if (!action || !["start", "stop", "restart"].includes(action)) {
    return NextResponse.json({ error: "action must be start, stop, or restart." }, { status: 400 });
  }

  const result = await executeProviderAction("docker", action, id);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
