import { redactSecrets } from "@/lib/providers/credentials";

export function redactActivityText(value: string) {
  return redactSecrets(value).slice(0, 2000);
}

export function sanitizeMetadata(metadata: Record<string, string>) {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    sanitized[key.slice(0, 64)] = redactActivityText(value).slice(0, 500);
  }
  return sanitized;
}
