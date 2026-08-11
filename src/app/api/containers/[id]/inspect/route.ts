import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import { getContainerDetail } from "@/lib/providers/runtime";
import type { ContainerDetailResult } from "@/lib/providers/types";

export const runtime = "nodejs";

function statusForDetailResult(result: ContainerDetailResult): number {
  switch (result.kind) {
    case "ok":
      return 200;
    case "not_found":
      return 404;
    case "unavailable":
      // Structured client handling (incl. endpoint_disconnected / stopped).
      return 200;
    case "error":
      // Provider/upstream failure — request itself was valid.
      return 502;
    default:
      return 502;
  }
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
  const providerId = url.searchParams.get("providerId")?.trim() ?? "";
  if (!providerId) {
    return NextResponse.json({ error: "providerId is required." }, { status: 400 });
  }

  const bypassCache = url.searchParams.get("refresh") === "1";
  const result = await getContainerDetail(id, providerId, { bypassCache });

  return NextResponse.json(result, { status: statusForDetailResult(result) });
}
