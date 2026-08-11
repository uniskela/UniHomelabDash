import { NextResponse } from "next/server";
import { AuthError, type SessionUser } from "@/lib/auth/types";
import type { StackResource } from "@/lib/providers/types";

type StackInventory = {
  resources: StackResource[];
  error?: string;
  warning?: string;
  cachedAt: number | null;
};

export function createStacksGetHandler(dependencies: {
  authorize: () => Promise<SessionUser>;
  listStacks: (options: { bypassCache: boolean }) => Promise<StackInventory>;
}) {
  return async function getStacks(request: Request) {
    try {
      await dependencies.authorize();
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      throw error;
    }

    const bypassCache = new URL(request.url).searchParams.get("refresh") === "1";
    const result = await dependencies.listStacks({ bypassCache });
    return NextResponse.json({
      stacks: result.resources,
      error: result.error ?? null,
      warning: result.warning ?? null,
      cachedAt: result.cachedAt,
    });
  };
}
