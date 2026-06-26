import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getSessionSecret } from "@/lib/auth/constants";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function deriveKey(secret: string) {
  return createHash("sha256").update(`uh-credentials:${secret}`).digest();
}

export function encryptCredentials(
  payload: Record<string, string>,
  secret = getSessionSecret()
): string {
  if (!secret) {
    throw new Error("SESSION_SECRET is required to store provider credentials.");
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, deriveKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptCredentials(
  token: string,
  secret = getSessionSecret()
): Record<string, string> {
  if (!secret) {
    throw new Error("SESSION_SECRET is required to read provider credentials.");
  }

  const [ivPart, authTagPart, encryptedPart] = token.split(".");
  if (!ivPart || !authTagPart || !encryptedPart) {
    throw new Error("Invalid encrypted credentials payload.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    deriveKey(secret),
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]);

  const parsed = JSON.parse(decrypted.toString("utf8")) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid decrypted credentials payload.");
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }

  return result;
}

export function redactSecrets(message: string) {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/password[=:]\S+/gi, "password=[redacted]")
    .replace(/token[=:]\S+/gi, "token=[redacted]")
    .replace(/api[_-]?key[=:]\S+/gi, (match) => `${match.split(/[=:]/)[0]}=[redacted]`)
    .replace(/secret[=:]\S+/gi, "secret=[redacted]");
}
