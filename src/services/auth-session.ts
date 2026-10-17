import { ApiError, type ApiClient } from "./api";
import type { AuthApi } from "./auth-api";
import type { SessionStorage } from "./session-storage";
import type { AuthState, LoginInput, RegisterInput } from "../types/auth";

export class AuthSession {
  private state: AuthState;
  private listeners = new Set<() => void>();
  private active = false;
  private operation = 0;
  private token: string | null = null;
  private controller: AbortController | null = null;
  private mutation = false;
  private storageQueue: Promise<unknown> = Promise.resolve();
  constructor(private readonly client: ApiClient, private readonly api: AuthApi, private readonly storage: SessionStorage) {
    this.state = { status: "checking", user: null, expiresAt: null, revision: client.sessionRevision, error: null, cleanupPending: false };
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  start = (): (() => void) => {
    this.active = true;
    const unsubscribe = this.client.onUnauthorized((revision) => {
      if (!this.mutation) void this.invalidate(revision);
    });
    void this.retryRestore();
    return () => {
      this.active = false;
      ++this.operation;
      this.controller?.abort();
      unsubscribe();
      this.client.replaceSession(null);
      this.token = null;
    };
  };

  retryRestore = async (): Promise<void> => {
    if (!this.active || this.mutation) return;
    const operation = ++this.operation;
    this.controller?.abort();
    this.controller = new AbortController();
    this.replaceSession(this.token, { status: "checking", user: null, expiresAt: null, error: null });
    try {
      if (!this.client.isWeb) {
        if (this.state.cleanupPending) {
          await this.queueStorage(() => this.storage.clear());
          if (!this.current(operation)) return;
          this.update({ cleanupPending: false });
        }
        const token = await this.queueStorage(() => this.storage.read());
        if (!this.current(operation)) return;
        this.replaceSession(token, {});
        if (!token) {
          this.update({ status: "anonymous" });
          return;
        }
      }
      const session = await this.api.me(this.controller.signal);
      if (this.current(operation)) this.update({ status: "authenticated", ...session, error: null });
    } catch (error) {
      if (!this.current(operation)) return;
      if (error instanceof ApiError && error.status === 401) await this.invalidate(this.state.revision);
      else this.update({ status: "restore-error", error: "Não foi possível restaurar sua sessão. Tente novamente." });
    }
  };
  retryCleanup = async (): Promise<void> => {
    if (!this.active || !this.state.cleanupPending || this.client.isWeb) return;
    const operation = this.beginMutation();
    try {
      await this.queueStorage(() => this.storage.clear());
      if (this.current(operation)) this.update({ cleanupPending: false, error: null });
    } catch {
      const error = new ApiError(0, "Não foi possível limpar a sessão do dispositivo. Tente novamente.");
      if (this.current(operation)) this.update({ error: error.message });
      throw error;
    } finally {
      this.mutation = false;
    }
  };
  login = async (input: LoginInput): Promise<void> => {
    const operation = this.beginMutation();
    const previousToken = this.token;
    try {
      const result = await this.api.login(input, this.controller!.signal);
      if (!this.current(operation)) {
        await this.revokeUnused(result.token);
        throw this.cancelled();
      }
      if (!this.client.isWeb) {
        const token = result.token;
        if (!token) throw new ApiError(502, "A API não retornou uma sessão válida.", "invalid-response");
        try {
          await this.queueStorage(() => this.storage.write(token));
        } catch {
          await this.revokeUnused(token);
          try {
            await this.queueStorage(() => previousToken ? this.storage.write(previousToken) : this.storage.clear());
          } catch {
            if (this.current(operation)) this.replaceSession(null, {
              status: "anonymous", user: null, expiresAt: null, cleanupPending: true,
            });
          }
          throw new ApiError(0, "Não foi possível salvar a sessão com segurança. Tente novamente.");
        }
      }
      if (!this.current(operation)) {
        await this.revokeUnused(result.token);
        throw this.cancelled();
      }
      this.replaceSession(result.token ?? null, {
        status: "authenticated", user: result.user, expiresAt: result.expiresAt, cleanupPending: false, error: null,
      });
    } catch (error) {
      if (this.current(operation)) this.update({
        status: this.state.status === "checking" ? "restore-error" : this.state.status,
        error: error instanceof ApiError ? error.message : "Não foi possível entrar. Tente novamente.",
      });
      throw error;
    } finally {
      this.mutation = false;
    }
  };
  logout = async (): Promise<void> => {
    const operation = this.beginMutation();
    try {
      await this.api.logout(this.token ?? undefined, this.controller!.signal);
      if (!this.current(operation)) return;
      this.replaceSession(null, {
        status: "anonymous", user: null, expiresAt: null, error: null, cleanupPending: !this.client.isWeb,
      });
      if (!this.client.isWeb) {
        try {
          await this.queueStorage(() => this.storage.clear());
        } catch {
          throw new ApiError(0, "Não foi possível limpar a sessão do dispositivo. Tente novamente.");
        }
      }
      if (this.current(operation)) this.update({ cleanupPending: false });
    } catch (error) {
      if (this.current(operation)) this.update({
        status: this.state.status === "checking" ? "restore-error" : this.state.status,
        error: error instanceof ApiError ? error.message : "Não foi possível sair. Tente novamente.",
      });
      throw error;
    } finally {
      this.mutation = false;
    }
  };
  register = (input: RegisterInput) => this.api.register(input);

  private beginMutation(): number {
    if (!this.active) throw new Error("A autenticação não está disponível.");
    if (this.mutation) throw new Error("Aguarde a operação atual.");
    this.mutation = true;
    const operation = ++this.operation;
    this.controller?.abort();
    this.controller = new AbortController();
    this.replaceSession(this.token, { error: null });
    return operation;
  }

  private cancelled(): Error {
    const error = new Error("Operação cancelada.");
    error.name = "AbortError";
    return error;
  }

  private async revokeUnused(token?: string) {
    if (this.client.isWeb || !token) return;
    try { await this.api.logout(token); } catch { /* A falha não pode transformar o login em sucesso. */ }
  }

  private current(operation: number) { return this.active && operation === this.operation; }

  private update(patch: Partial<AuthState>) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  private replaceSession(token: string | null, patch: Partial<AuthState>) {
    this.token = this.client.isWeb ? null : token;
    const revision = this.client.replaceSession(this.token);
    this.update({ ...patch, revision });
  }

  private queueStorage<T>(action: () => Promise<T>): Promise<T> {
    const result = this.storageQueue.then(action);
    this.storageQueue = result.catch(() => undefined);
    return result;
  }

  private async invalidate(revision: number) {
    if (!this.active || revision !== this.state.revision) return;
    ++this.operation;
    this.controller?.abort();
    this.replaceSession(null, {
      status: "anonymous", user: null, expiresAt: null, error: null, cleanupPending: !this.client.isWeb,
    });
    const cleanupRevision = this.state.revision;
    if (this.client.isWeb) return;
    try {
      await this.queueStorage(() => this.storage.clear());
      if (this.active && this.state.revision === cleanupRevision) this.update({ cleanupPending: false });
    } catch {
      if (this.active && this.state.revision === cleanupRevision) {
        this.update({ cleanupPending: true, error: "Não foi possível limpar a sessão do dispositivo. Tente novamente." });
      }
    }
  }
}
