import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { services } from "@/lib/db/schema";

export async function listServices() {
  return getDb().select().from(services).orderBy(desc(services.updatedAt));
}
