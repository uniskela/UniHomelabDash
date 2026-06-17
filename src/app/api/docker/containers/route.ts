import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import { listProviderResources } from "@/lib/providers/runtime";

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

  const { resources, error } = await listProviderResources("docker");

  if (error) {
    return NextResponse.json({ containers: [], error }, { status: 200 });
  }

  return NextResponse.json({ containers: resources, error: null });
}
