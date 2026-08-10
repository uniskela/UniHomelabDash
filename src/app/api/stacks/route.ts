import { requireAuth } from "@/lib/auth/session-user";
import { listStackResources } from "@/lib/providers/runtime";
import { createStacksGetHandler } from "@/lib/providers/stacks-route";

export const runtime = "nodejs";

export const GET = createStacksGetHandler({
  authorize: requireAuth,
  listStacks: listStackResources,
});
