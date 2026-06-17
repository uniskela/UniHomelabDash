import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import { getProviderRowById } from "@/lib/providers/registry";
import { testProviderConnection } from "@/lib/providers/runtime";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
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
  const row = getProviderRowById(id);
  if (!row) {
    return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  }

  const result = await testProviderConnection(id);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
