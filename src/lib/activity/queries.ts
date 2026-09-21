import {
  countOpenAlerts,
  listOpenAlerts,
  listRecentActivityEvents,
  listRecentAlerts,
} from "@/lib/activity/record";

export async function getActivityFeed(limit = 50) {
  return listRecentActivityEvents(limit);
}

export async function getAlertsSummary() {
  const [openAlerts, recentAlerts, openCount] = await Promise.all([
    listOpenAlerts(25),
    listRecentAlerts(25),
    Promise.resolve(countOpenAlerts()),
  ]);

  return {
    openAlerts,
    recentAlerts,
    openCount,
  };
}
