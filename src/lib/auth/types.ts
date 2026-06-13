export type AuthActionState = {
  ok: boolean;
  message: string;
};

export type SessionUser = {
  id: string;
  username: string;
};

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
