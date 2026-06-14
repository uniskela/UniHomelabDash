import bcrypt from "bcryptjs";

export const BCRYPT_ROUNDS = 12;
export const BCRYPT_MAX_PASSWORD_BYTES = 72;

export function passwordExceedsBcryptLimit(password: string) {
  return new TextEncoder().encode(password).length > BCRYPT_MAX_PASSWORD_BYTES;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
