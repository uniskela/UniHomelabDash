import { requireAuth } from "@/lib/auth/session-user";
import { listStackContainerResources } from "@/lib/providers/runtime";
import { createStackContainersGetHandler } from "@/lib/providers/stack-containers-route";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const bypassCache = new URL(request.url).searchParams.get("refresh") === "1";

  return createStackContainersGetHandler({
    authorize: requireAuth,
    listContainers: listStackContainerResources,
    resourceId: id,
    bypassCache,
  })();
}
