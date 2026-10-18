import { ApiError } from "./api";
import type { GamesApi } from "./games-api";
import type { LocalCovers } from "./local-covers";
import { resolveLocalCover } from "./local-covers";
import { findPresetForGame } from "../data/game-presets";
import type { CreateGameInput, Game, GamePlatform, GameStatus, UpdateGameInput } from "../types/game";

export type GamesState = {
  ownerId: string | null;
  revision: number;
  games: Game[];
  platforms: GamePlatform[];
  loading: boolean;
  error: string | null;
  warning: string | null;
};
export function cancelledGameRequest() {
  const error = new Error("A sessão mudou. Tente novamente.");
  error.name = "AbortError";
  return error;
}

export class GamesStore {
  private state: GamesState = { ownerId: null, revision: -1, games: [], platforms: [], loading: false, error: null, warning: null };
  private listeners = new Set<() => void>();
  private controller = new AbortController();
  private loadController: AbortController | null = null;
  private loadVersion = 0;
  private mutationVersion = 0;
  private locks = new Set<string>();
  constructor(private api: GamesApi, private covers: LocalCovers, private sessionRevision: () => number) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };

  setSession(ownerId: string | null, revision: number) {
    if (ownerId === this.state.ownerId && revision === this.state.revision) return;
    this.controller.abort(); this.loadController?.abort();
    this.controller = new AbortController(); ++this.loadVersion; ++this.mutationVersion;
    this.locks = new Set();
    this.update({ ownerId, revision, games: [], platforms: [], loading: !!ownerId, error: null, warning: null });
    if (ownerId) void this.reload(revision);
  }
  dispose = () => {
    this.controller.abort(); this.loadController?.abort(); ++this.loadVersion;
    this.update({ ownerId: null, games: [], platforms: [], loading: false, revision: -1 });
  };

  reload = async (revision: number): Promise<void> => {
    if (!this.current(revision)) return;
    const version = ++this.loadVersion;
    const mutationVersion = this.mutationVersion;
    this.loadController?.abort();
    const controller = new AbortController(); this.loadController = controller;
    this.update({ loading: true, error: null });
    try {
      const [games, platforms] = await Promise.all([this.api.list(controller.signal), this.api.platforms(controller.signal)]);
      this.assertCurrent(revision);
      const covered = await Promise.all(games.map(game => this.overlay(game, revision)));
      if (!this.current(revision) || version !== this.loadVersion) return;
      this.update({ ...(mutationVersion === this.mutationVersion ? { games: covered } : {}), platforms, loading: false });
    } catch (error) {
      if (!this.current(revision) || version !== this.loadVersion) return;
      this.update({ loading: false, error: error instanceof ApiError ? error.message : "Não foi possível carregar sua biblioteca. Tente novamente." });
    }
  };

  getGame = async (id: string, revision: number): Promise<Game> => {
    this.assertCurrent(revision);
    const version = this.mutationVersion;
    const game = await this.api.get(id, this.controller.signal);
    this.assertCurrent(revision);
    const covered = await this.overlay(game, revision);
    this.assertCurrent(revision);
    if (version !== this.mutationVersion) {
      const current = this.state.games.find(item => item.id === id);
      if (current) return current;
      throw cancelledGameRequest();
    }
    this.upsert(covered);
    return covered;
  };

  addGame = (input: CreateGameInput, revision: number): Promise<Game> => this.mutate("create", revision, async () => {
    if (this.state.games.some(game => game.platformId === input.platformId && game.title.trim().toLowerCase() === input.title.trim().toLowerCase())) {
      throw new ApiError(409, "Este jogo já está na sua biblioteca nesta plataforma.");
    }
    const { localCover, ...data } = input;
    const game = await this.api.create(data, this.controller.signal);
    return this.save(game, localCover, revision);
  });
  updateGame = (id: string, input: UpdateGameInput, revision: number): Promise<Game> => this.mutate(id, revision, async () => {
    const { localCover, status, ...data } = input;
    let game = await this.save(await this.api.update(id, data, this.controller.signal), localCover, revision);
    if (status !== undefined) {
      this.assertCurrent(revision);
      try { game = await this.save(await this.api.status(id, status, this.controller.signal), undefined, revision); }
      catch (error) {
        this.assertCurrent(revision);
        throw new ApiError(error instanceof ApiError ? error.status : 0, "Os dados do jogo foram salvos, mas não foi possível atualizar o status. Tente novamente.");
      }
    }
    return game;
  });
  setStatus = (id: string, status: GameStatus | null, revision: number) => this.mutate(id, revision, async () =>
    this.save(await this.api.status(id, status, this.controller.signal), undefined, revision));
  setRating = (id: string, rating: number, revision: number) => this.mutate(id, revision, async () =>
    this.save(await this.api.rating(id, rating, this.controller.signal), undefined, revision));
  toggleFavorite = (id: string, revision: number) => this.mutate(id, revision, async () =>
    this.save(await this.api.favorite(id, this.controller.signal), undefined, revision));
  removeGame = (id: string, revision: number) => this.mutate(id, revision, async () => {
    await this.api.remove(id, this.controller.signal); this.assertCurrent(revision);
    ++this.mutationVersion;
    const ownerId = this.state.ownerId!;
    this.update({ games: this.state.games.filter(game => game.id !== id) });
    try { await this.covers.remove(ownerId, id); }
    catch { if (this.current(revision)) this.update({ warning: "O jogo foi excluído, mas não foi possível limpar a capa deste dispositivo." }); }
    this.assertCurrent(revision);
  });

  private async mutate<T>(id: string, revision: number, action: () => Promise<T>): Promise<T> {
    this.assertCurrent(revision);
    const locks = this.locks;
    if (locks.has(id)) throw new ApiError(0, "Aguarde a alteração anterior deste jogo.");
    locks.add(id);
    try { return await action(); } finally { locks.delete(id); }
  }
  private async save(game: Game, uri: string | null | undefined, revision: number) {
    this.assertCurrent(revision); ++this.mutationVersion;
    const ownerId = this.state.ownerId!;
    let covered: Game;
    if (uri === undefined) covered = await this.overlay(game, revision);
    else {
      try { await this.covers.write(ownerId, game.id, uri === null ? "none" : uri); }
      catch { if (this.current(revision)) this.update({ warning: "O jogo foi salvo, mas a capa local não pôde ser mantida. Selecione a imagem novamente para tentar salvar a capa." }); }
      covered = uri ? { ...game, cover: resolveLocalCover(uri), localCoverReference: uri } : game;
    }
    this.assertCurrent(revision); this.upsert(covered); return covered;
  }
  private async overlay(game: Game, revision: number): Promise<Game> {
    this.assertCurrent(revision);
    const ownerId = this.state.ownerId!;
    try {
      const uri = await this.covers.read(ownerId, game.id);
      if (uri === "none") return game;
      return uri ? { ...game, cover: resolveLocalCover(uri), localCoverReference: uri } : this.presetCover(game);
    } catch {
      if (this.current(revision)) this.update({ warning: "Não foi possível carregar algumas capas deste dispositivo." });
      return this.presetCover(game);
    }
  }
  private presetCover(game: Game): Game {
    const preset = game.coverUrl ? undefined : findPresetForGame(game);
    return preset ? { ...game, cover: preset.cover, localCoverReference: `preset:${preset.id}` } : game;
  }
  private upsert(game: Game) {
    const exists = this.state.games.some(item => item.id === game.id);
    this.update({ games: exists ? this.state.games.map(item => item.id === game.id ? game : item) : [game, ...this.state.games] });
  }
  private current(revision: number) {
    return !!this.state.ownerId && this.state.revision === revision && this.sessionRevision() === revision && !this.controller.signal.aborted;
  }
  private assertCurrent(revision: number) { if (!this.current(revision)) throw cancelledGameRequest(); }
  private update(patch: Partial<GamesState>) { this.state = { ...this.state, ...patch }; for (const listener of this.listeners) listener(); }
}
