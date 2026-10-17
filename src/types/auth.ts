export type PublicUser = {
  id: string;
  name: string;
  username: string | null;
  email: string;
  createdAt: string;
};

export type RegisterInput = { name: string; username: string; email: string; password: string };
export type LoginInput = { identifier: string; password: string };
export type SessionResponse = { user: PublicUser; expiresAt: string };
export type LoginResponse = SessionResponse & { token?: string };
export type RegistrationResponse = { message: string };
export type AuthStatus = "checking" | "authenticated" | "anonymous" | "restore-error";

export type AuthState = {
  status: AuthStatus;
  user: PublicUser | null;
  expiresAt: string | null;
  revision: number;
  error: string | null;
  cleanupPending: boolean;
};
