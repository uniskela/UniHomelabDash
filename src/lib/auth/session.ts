import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  SETUP_COOKIE_NAME,
  getSessionSecret,
  isCookieSecureEnabled,
} from "@/lib/auth/constants";

export type SessionPayload = {
  userId: string;
  exp: number;
};

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const binary = atob(padded + padding);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signValue(value: string, secret: string) {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

async function verifyValue(value: string, signature: string, secret: string) {
  const signatureBytes = fromBase64Url(signature);
  if (!signatureBytes) {
    return false;
  }

  const key = await importHmacKey(secret);
  return crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(value));
}

async function createSignedToken(payload: string, secret: string) {
  const signature = await signValue(payload, secret);
  return `${toBase64Url(encoder.encode(payload))}.${signature}`;
}

async function verifySignedToken<T>(token: string, secret: string): Promise<T | null> {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const payloadBytes = fromBase64Url(encodedPayload);
  if (!payloadBytes) {
    return null;
  }

  const payload = new TextDecoder().decode(payloadBytes);
  const valid = await verifyValue(payload, signature, secret);
  if (!valid) {
    return null;
  }

  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

export async function createSessionToken(userId: string) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  const payload: SessionPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  return createSignedToken(JSON.stringify(payload), secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  const payload = await verifySignedToken<SessionPayload>(token, secret);
  if (!payload || typeof payload.userId !== "string" || typeof payload.exp !== "number") {
    return null;
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export async function createSetupToken() {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  return createSignedToken(JSON.stringify({ setup: true }), secret);
}

export async function verifySetupToken(token: string) {
  const secret = getSessionSecret();
  if (!secret) {
    return false;
  }

  const payload = await verifySignedToken<{ setup?: boolean }>(token, secret);
  return payload?.setup === true;
}

export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isCookieSecureEnabled(),
    path: "/",
    maxAge,
  };
}

export function getSetupCookieOptions() {
  return {
    name: SETUP_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isCookieSecureEnabled(),
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 10,
  };
}

export function getClearSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isCookieSecureEnabled(),
    path: "/",
    maxAge: 0,
  };
}

export function getClearSetupCookieOptions() {
  return {
    name: SETUP_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isCookieSecureEnabled(),
    path: "/",
    maxAge: 0,
  };
}
