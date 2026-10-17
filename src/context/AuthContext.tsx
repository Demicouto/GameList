import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import type { AuthState, LoginInput, RegisterInput, RegistrationResponse } from "../types/auth";
import { apiClient } from "../services/api";
import { authApi } from "../services/auth-api";
import { sessionStorage } from "../services/session-storage";
import { AuthSession } from "../services/auth-session";

type AuthContextValue = AuthState & {
  login(input: LoginInput): Promise<void>;
  register(input: RegisterInput): Promise<RegistrationResponse>;
  logout(): Promise<void>;
  retryRestore(): Promise<void>;
  retryCleanup(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session] = useState(() => new AuthSession(apiClient, authApi, sessionStorage));
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  useEffect(() => session.start(), [session]);
  const value = useMemo<AuthContextValue>(() => ({
    ...state, login: session.login, register: session.register, logout: session.logout,
    retryRestore: session.retryRestore, retryCleanup: session.retryCleanup,
  }), [state, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro do AuthProvider.");
  return context;
}
