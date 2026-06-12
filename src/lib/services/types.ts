import type { healthStatuses, services } from "@/lib/db/schema";

export type ManualService = typeof services.$inferSelect;
export type HealthStatus = (typeof healthStatuses)[number];
