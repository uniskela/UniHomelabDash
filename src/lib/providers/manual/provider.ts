import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { services } from "@/lib/db/schema";
import type {
  ConnectionTestResult,
  ProviderContext,
  ProviderHandler,
  ProviderResource,
} from "@/lib/providers/types";

export const manualProviderHandler: ProviderHandler = {
  meta: {
    type: "manual",
    name: "Manual services",
    description: "Bookmarks and on-demand HTTP health checks for URLs you add manually.",
    capabilities: ["service.status", "service.open"],
    supportsCredentials: false,
  },

  async testConnection(): Promise<ConnectionTestResult> {
    return { ok: true, message: "Manual services are always available." };
  },

  async listResources(context: ProviderContext): Promise<ProviderResource[]> {
    void context;
    const rows = getDb().select().from(services).orderBy(desc(services.updatedAt)).all();

    return rows.map((service) => ({
      id: service.id,
      kind: "manual-service",
      name: service.name,
      status: service.healthStatus,
      summary: service.url,
      providerType: "manual",
      meta: {
        category: service.category,
        host: service.host,
      },
    }));
  },
};
