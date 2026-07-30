import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import { listContainerResources } from "@/lib/providers/runtime";

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

  const result = await listContainerResources();

  return NextResponse.json({
    containers: result.resources,
    error: result.error ?? null,
    warning: result.warning ?? null,
    cachedAt: result.cachedAt ?? null,
  });
}
