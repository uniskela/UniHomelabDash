export function sanitizeLocalRedirectPath(
  path: string | null | undefined,
  fallback = "/"
): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes(":") || path.includes("\\")) {
    return fallback;
  }

  return path;
}
