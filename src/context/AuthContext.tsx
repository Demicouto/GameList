import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { AuthState, LoginInput, RegisterInput, RegistrationResponse } from "../types/auth";
import { apiClient } from "../services/api";
import { authApi } from "../services/auth-api";
import { sessionStorage } from "../services/session-storage";
import { AuthSession } from "../services/auth-session";
import { AppState, Platform } from "react-native";

const SESSION_CHANGE_KEY = "gamelist.auth.changed";
function announceWebSessionChange() {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  try { window.localStorage.setItem(SESSION_CHANGE_KEY, `${Date.now()}:${Math.random()}`); }
  catch { /* Focus revalidation also works when browser storage is unavailable. */ }
}

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
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const restore = () => { void session.retryRestore(); };
    const focused = () => {
      // Keep partially filled anonymous forms mounted when switching windows.
      if (session.getSnapshot().status !== "anonymous") restore();
    };
    const changed = (event: StorageEvent) => {
      if (event.key === SESSION_CHANGE_KEY || event.key === null) restore();
    };
    window.addEventListener("focus", focused);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener("focus", focused);
      window.removeEventListener("storage", changed);
    };
  }, [session]);
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
  const actions = useMemo(() => ({
    login: async (input: LoginInput) => { await session.login(input); announceWebSessionChange(); },
    logout: async () => { await session.logout(); announceWebSessionChange(); },
  }), [session]);
  const value = useMemo<AuthContextValue>(() => ({
    ...state, ...actions, register: session.register,
    retryRestore: session.retryRestore, retryCleanup: session.retryCleanup,
  }), [state, session, actions]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro do AuthProvider.");
  return context;
}
