import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { AuthState, LoginInput, RegisterInput, RegistrationResponse } from "../types/auth";
import { apiClient } from "../services/api";
import { authApi } from "../services/auth-api";
import { sessionStorage } from "../services/session-storage";
import { AuthSession } from "../services/auth-session";
import { AppState } from "react-native";

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
  const lastExpiryCheck = useRef<string | null>(null);
  useEffect(() => session.start(), [session]);
  useEffect(() => {
    if (state.status === 'anonymous') lastExpiryCheck.current = null;
    if (state.status !== 'authenticated' || !state.expiresAt) return;
    const expiresAt = Date.parse(state.expiresAt);
    const expiryKey = `${state.user?.id}:${state.expiresAt}`;
    let timer: ReturnType<typeof setTimeout>;
    // A 30-day session exceeds the maximum delay supported by JS timers.
    function checkExpiry() {
      clearTimeout(timer);
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        // A device clock ahead of the server must not trigger a request loop.
        if (lastExpiryCheck.current !== expiryKey) {
          lastExpiryCheck.current = expiryKey;
          void session.retryRestore();
        } else {
          timer = setTimeout(() => {
            lastExpiryCheck.current = null;
            checkExpiry();
          }, 60000);
        }
      }
      else timer = setTimeout(checkExpiry, Math.min(remaining, 2147483647));
    }
    checkExpiry();
    const listener = AppState.addEventListener('change', next => {
      if (next === 'active') { lastExpiryCheck.current = null; checkExpiry(); }
    });
    return () => { clearTimeout(timer); listener.remove(); };
  }, [session, state.status, state.expiresAt, state.user?.id, state.revision]);
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
