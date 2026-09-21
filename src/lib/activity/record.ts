import { desc, eq, inArray, lt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  activityEvents,
  alerts,
  type ActivitySeverity,
  type AlertStatus,
} from "@/lib/db/schema";
import { redactActivityText, sanitizeMetadata } from "@/lib/activity/redact";
import type {
  ActivityEventView,
  AlertView,
  RecordActivityInput,
} from "@/lib/activity/types";

const DEFAULT_RETENTION_DAYS = 30;
const MAX_EVENTS_PER_PRUNE = 500;

export function recordActivity(input: RecordActivityInput): ActivityEventView | null {
  try {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const detail = redactActivityText(input.detail ?? "");
    const metadata = sanitizeMetadata(input.metadata ?? {});
    const title = redactActivityText(input.title).slice(0, 200);

    getDb()
      .insert(activityEvents)
      .values({
        id,
        type: input.type,
        severity: input.severity,
        title,
        detail,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        providerId: input.providerId ?? null,
        metadataJson: JSON.stringify(metadata),
        createdAt: now,
      })
      .run();

    if (input.resolveAlert && input.alertDedupeKey) {
      resolveAlertByDedupeKey(input.alertDedupeKey, now);
    } else if (input.alertDedupeKey) {
      upsertOpenAlert({
        activityEventId: id,
        type: input.type,
        severity: input.severity,
        title,
        detail,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        providerId: input.providerId ?? null,
        dedupeKey: input.alertDedupeKey,
        createdAt: now,
      });
    }

    try {
      pruneOldActivityEvents();
    } catch {
      // Retention pruning is best-effort and must not block recording.
    }

    return {
      id,
      type: input.type,
      severity: input.severity,
      title,
      detail,
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      providerId: input.providerId ?? null,
      metadata,
      createdAt: now,
    };
  } catch {
    // Activity recording must never break health checks or container actions.
    return null;
  }
}

function upsertOpenAlert(input: {
  activityEventId: string;
  type: string;
  severity: ActivitySeverity;
  title: string;
  detail: string;
  resourceType: string | null;
  resourceId: string | null;
  providerId: string | null;
  dedupeKey: string;
  createdAt: string;
}) {
  const existing = getDb()
    .select()
    .from(alerts)
    .where(eq(alerts.dedupeKey, input.dedupeKey))
    .all();

  const active = existing.find(
    (row) => row.status === "open" || row.status === "acknowledged"
  );

  if (active) {
    getDb()
      .update(alerts)
      .set({
        activityEventId: input.activityEventId,
        type: input.type,
        severity: input.severity,
        title: input.title,
        detail: input.detail,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        providerId: input.providerId,
        status: "open",
        updatedAt: input.createdAt,
        resolvedAt: null,
      })
      .where(eq(alerts.id, active.id))
      .run();
    return;
  }

  getDb()
    .insert(alerts)
    .values({
      id: crypto.randomUUID(),
      activityEventId: input.activityEventId,
      type: input.type,
      severity: input.severity,
      title: input.title,
      detail: input.detail,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      providerId: input.providerId,
      status: "open",
      dedupeKey: input.dedupeKey,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      resolvedAt: null,
    })
    .run();
}

function resolveAlertByDedupeKey(dedupeKey: string, resolvedAt: string) {
  const existing = getDb()
    .select()
    .from(alerts)
    .where(eq(alerts.dedupeKey, dedupeKey))
    .all();

  for (const row of existing) {
    if (row.status === "resolved") {
      continue;
    }
    getDb()
      .update(alerts)
      .set({
        status: "resolved",
        updatedAt: resolvedAt,
        resolvedAt,
      })
      .where(eq(alerts.id, row.id))
      .run();
  }
}

export function updateAlertStatus(alertId: string, status: AlertStatus) {
  const now = new Date().toISOString();
  const resolvedAt = status === "resolved" ? now : null;

  getDb()
    .update(alerts)
    .set({
      status,
      updatedAt: now,
      resolvedAt,
    })
    .where(eq(alerts.id, alertId))
    .run();
}

export function listRecentActivityEvents(limit = 50): ActivityEventView[] {
  const rows = getDb()
    .select()
    .from(activityEvents)
    .orderBy(desc(activityEvents.createdAt))
    .limit(limit)
    .all();

  return rows.map(mapActivityRow);
}

export function listOpenAlerts(limit = 50): AlertView[] {
  const rows = getDb()
    .select()
    .from(alerts)
    .where(inArray(alerts.status, ["open", "acknowledged"]))
    .orderBy(desc(alerts.updatedAt))
    .limit(limit)
    .all();

  return rows.map(mapAlertRow);
}

export function listRecentAlerts(limit = 50): AlertView[] {
  const rows = getDb()
    .select()
    .from(alerts)
    .orderBy(desc(alerts.createdAt))
    .limit(limit)
    .all();

  return rows.map(mapAlertRow);
}

export function countOpenAlerts() {
  const [row] = getDb()
    .select({ count: sql<number>`count(*)` })
    .from(alerts)
    .where(inArray(alerts.status, ["open", "acknowledged"]))
    .all();

  return row?.count ?? 0;
}

function mapActivityRow(row: typeof activityEvents.$inferSelect): ActivityEventView {
  let metadata: Record<string, string> = {};
  try {
    const parsed = JSON.parse(row.metadataJson) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string") {
          metadata[key] = value;
        }
      }
    }
  } catch {
    metadata = {};
  }

  return {
    id: row.id,
    type: row.type,
    severity: row.severity,
    title: row.title,
    detail: row.detail,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    providerId: row.providerId,
    metadata,
    createdAt: row.createdAt,
  };
}

function mapAlertRow(row: typeof alerts.$inferSelect): AlertView {
  return {
    id: row.id,
    activityEventId: row.activityEventId,
    type: row.type,
    severity: row.severity,
    title: row.title,
    detail: row.detail,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    providerId: row.providerId,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    resolvedAt: row.resolvedAt,
  };
}

function pruneOldActivityEvents() {
  const retentionDays = Number.parseInt(process.env.ACTIVITY_RETENTION_DAYS ?? "", 10);
  const days = Number.isFinite(retentionDays) && retentionDays > 0
    ? retentionDays
    : DEFAULT_RETENTION_DAYS;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  getDb()
    .delete(activityEvents)
    .where(lt(activityEvents.createdAt, cutoff))
    .run();

  // Keep resolved alerts longer but trim very old resolved rows opportunistically.
  const resolvedCutoff = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString();
  getDb()
    .delete(alerts)
    .where(lt(alerts.resolvedAt, resolvedCutoff))
    .run();

  const [countRow] = getDb()
    .select({ count: sql<number>`count(*)` })
    .from(activityEvents)
    .all();

  const total = countRow?.count ?? 0;
  if (total <= MAX_EVENTS_PER_PRUNE * 4) {
    return;
  }

  const overflow = getDb()
    .select({ id: activityEvents.id })
    .from(activityEvents)
    .orderBy(desc(activityEvents.createdAt))
    .offset(MAX_EVENTS_PER_PRUNE * 4)
    .all();

  if (overflow.length === 0) {
    return;
  }

  getDb()
    .delete(activityEvents)
    .where(
      inArray(
        activityEvents.id,
        overflow.map((row) => row.id)
      )
    )
    .run();
}
