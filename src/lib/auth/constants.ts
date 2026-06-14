export const SESSION_COOKIE_NAME = "uh_session";
export const SETUP_COOKIE_NAME = "uh_setup";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const MAX_USERNAME_LENGTH = 50;

export function isAuthDisabled() {
  return process.env.AUTH_DISABLED === "true";
}

export function getSessionSecret() {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  if (process.env.NODE_ENV !== "production" && !isAuthDisabled()) {
    return "dev-only-insecure-session-secret";
  }

  return "";
}

export function assertSessionSecretConfigured() {
  if (isAuthDisabled()) {
    return;
  }

  if (process.env.NODE_ENV === "production" && !getSessionSecret()) {
    throw new Error("SESSION_SECRET is required in production when authentication is enabled.");
  }
}

/** Only set Secure cookies when explicitly enabled (e.g. behind HTTPS reverse proxy). */
export function isCookieSecureEnabled() {
  return process.env.COOKIE_SECURE === "true";
}
