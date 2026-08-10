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
  listStacks: () => Promise<StackInventory>;
}) {
  return async function getStacks() {
    try {
      await dependencies.authorize();
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      throw error;
    }

    const result = await dependencies.listStacks();
    return NextResponse.json({
      stacks: result.resources,
      error: result.error ?? null,
      warning: result.warning ?? null,
      cachedAt: result.cachedAt,
    });
  };
}
