import { ApiError, apiClient, type ApiClient } from "./api";
import type { LoginInput, LoginResponse, RegisterInput, RegistrationResponse, SessionResponse } from "../types/auth";

export interface AuthApi {
  register(input: RegisterInput, signal?: AbortSignal): Promise<RegistrationResponse>;
  login(input: LoginInput, signal?: AbortSignal): Promise<LoginResponse>;
  me(signal?: AbortSignal): Promise<SessionResponse>;
  logout(token?: string, signal?: AbortSignal): Promise<void>;
}

function invalidResponse(): never {
  throw new ApiError(502, "A API retornou uma resposta de autenticação inválida.", "invalid-response");
}

function parseSession(value: unknown): SessionResponse {
  if (!value || typeof value !== "object" || !("user" in value) || !("expiresAt" in value)) return invalidResponse();
  const { user, expiresAt } = value;
  if (!user || typeof user !== "object" || !("id" in user) || !("name" in user) || !("username" in user)
    || !("email" in user) || !("createdAt" in user)) return invalidResponse();
  if (typeof user.id !== "string" || !user.id || typeof user.name !== "string"
    || (user.username !== null && typeof user.username !== "string") || typeof user.email !== "string"
    || typeof user.createdAt !== "string" || !Number.isFinite(Date.parse(user.createdAt))
    || typeof expiresAt !== "string" || !Number.isFinite(Date.parse(expiresAt))) return invalidResponse();
  return {
    user: { id: user.id, name: user.name, username: user.username, email: user.email, createdAt: user.createdAt },
    expiresAt,
  };
}

export function createAuthApi(client: ApiClient): AuthApi {
  return {
    async register(input, signal) {
      const result = await client.request<unknown>("/auth/register", { method: "POST", body: input, authenticated: false, signal });
      if (!result || typeof result !== "object" || !("message" in result) || typeof result.message !== "string") return invalidResponse();
      return { message: result.message };
    },
    async login(input, signal) {
      const result = await client.request<unknown>("/auth/login", {
        method: "POST", body: input, authenticated: false, transport: client.isWeb ? "cookie" : "bearer", signal,
      });
      const session = parseSession(result);
      if (client.isWeb) return session;
      if (!result || typeof result !== "object" || !("token" in result) || typeof result.token !== "string"
        || !/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(result.token)) return invalidResponse();
      return { ...session, token: result.token };
    },
    async me(signal) {
      return parseSession(await client.request<unknown>("/auth/me", { signal }));
    },
    async logout(token, signal) {
      await client.request<void>("/auth/logout", { method: "POST", token, signal, notifyUnauthorized: false });
    },
  };
}

export const authApi = createAuthApi(apiClient);
