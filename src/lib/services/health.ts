import type { HealthStatus } from "@/lib/services/types";

const HEALTH_CHECK_TIMEOUT_MS = 5000;

export async function checkServiceHealth(healthUrl: string): Promise<{
  status: HealthStatus;
  checkedAt: string;
  errorMessage: string;
}> {
  const checkedAt = new Date().toISOString();

  if (!healthUrl) {
    return { status: "unknown", checkedAt, errorMessage: "" };
  }

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
    });

    if (response.status >= 200 && response.status < 400) {
      return { status: "healthy", checkedAt, errorMessage: "" };
    }

    return {
      status: "degraded",
      checkedAt,
      errorMessage: `HTTP ${response.status} ${response.statusText || "error"}`,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "Request timed out after 5 seconds"
        : error instanceof Error
          ? error.message
          : "Health check failed";

    return {
      status: "degraded",
      checkedAt,
      errorMessage: message,
    };
  }
}
