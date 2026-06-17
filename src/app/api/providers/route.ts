import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import {
  listProviderDefinitions,
  listProviderRows,
  rowToPublicView,
  toProviderRow,
} from "@/lib/providers/registry";

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

  const definitions = listProviderDefinitions();
  const configured = listProviderRows().map((row) => rowToPublicView(toProviderRow(row)));

  return NextResponse.json({ definitions, configured });
}
