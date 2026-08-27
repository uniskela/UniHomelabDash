import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import { listRecentActivityEvents } from "@/lib/activity/record";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "50", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 50;

  const events = listRecentActivityEvents(limit);

  return NextResponse.json({ events });
}
