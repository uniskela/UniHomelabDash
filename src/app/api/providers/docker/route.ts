import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/types";
import { requireAuth } from "@/lib/auth/session-user";
import { getProviderRowByType, rowToPublicView, toProviderRow } from "@/lib/providers/registry";
import { upsertDockerProvider } from "@/lib/providers/store";
import type { DockerConnectionMode } from "@/lib/providers/docker/config";

export const runtime = "nodejs";

function parseMode(value: unknown): DockerConnectionMode {
  return value === "tcp" || value === "tls" ? value : "local";
}

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
    allowActions?: boolean;
    connectionMode?: DockerConnectionMode;
    socketPath?: string;
    host?: string;
    port?: number;
    tlsCa?: string;
    tlsCert?: string;
    tlsKey?: string;
  } | null;

  if (!body || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled boolean is required." }, { status: 400 });
  }

  const mode = parseMode(body.connectionMode);
  const credentials =
    body.tlsCa || body.tlsCert || body.tlsKey
      ? {
          ...(body.tlsCa ? { tlsCa: body.tlsCa } : {}),
          ...(body.tlsCert ? { tlsCert: body.tlsCert } : {}),
          ...(body.tlsKey ? { tlsKey: body.tlsKey } : {}),
        }
      : undefined;

  const id = upsertDockerProvider({
    enabled: body.enabled,
    readOnly: body.allowActions !== true,
    config: {
      mode,
      socketPath: body.socketPath?.trim() || "/var/run/docker.sock",
      host: body.host?.trim() || "127.0.0.1",
      port: body.port ?? (mode === "tls" ? 2376 : 2375),
    },
    credentials: mode === "tls" ? credentials : undefined,
    preserveCredentials: mode === "tls" && !credentials,
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
