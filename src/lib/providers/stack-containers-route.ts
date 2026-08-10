import { NextResponse } from "next/server";
import { AuthError, type SessionUser } from "@/lib/auth/types";
import type { ListStackContainersResult } from "@/lib/providers/types";

export function createStackContainersGetHandler(dependencies: {
  authorize: () => Promise<SessionUser>;
  listContainers: (
    resourceId: string,
    options: { bypassCache?: boolean }
  ) => Promise<ListStackContainersResult>;
  resourceId: string;
  bypassCache: boolean;
}) {
  return async function getStackContainers() {
    try {
      await dependencies.authorize();
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      throw error;
    }

    try {
      const result = await dependencies.listContainers(dependencies.resourceId, {
        bypassCache: dependencies.bypassCache,
      });

      if (result.kind === "not_found") {
        return NextResponse.json(
          {
            containers: [],
            reason: null,
            error: "Stack not found.",
            cachedAt: null,
          },
          { status: 404 }
        );
      }

      if (result.kind === "unavailable") {
        return NextResponse.json({
          containers: [],
          reason: result.reason,
          error: null,
          cachedAt: null,
        });
      }

      return NextResponse.json({
        containers: result.resources,
        reason: null,
        error: null,
        cachedAt: result.cachedAt ?? null,
      });
    } catch {
      return NextResponse.json({ error: "Could not load stack containers." }, { status: 502 });
    }
  };
}
