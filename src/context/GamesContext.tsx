import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { apiClient } from "../services/api";
import { gamesApi } from "../services/games-api";
import { localCovers } from "../services/local-covers";
import { GamesStore } from "../services/games-store";
import type { CreateGameInput, Game, GamePlatform, GameStatus, UpdateGameInput } from "../types/game";

export type StatKey = "playing" | "completed" | "paused" | "favorites";
export type GameStats = Record<StatKey, number>;
type GamesContextValue = {
  games: Game[];
  platforms: GamePlatform[];
  stats: GameStats;
  revision: number;
  loading: boolean;
  error: string | null;
  warning: string | null;
  reload(): Promise<void>;
  getGame(id: string): Promise<Game>;
  addGame(input: CreateGameInput): Promise<Game>;
  updateGame(id: string, changes: UpdateGameInput): Promise<Game>;
  setStatus(id: string, status: GameStatus | null): Promise<Game>;
  setRating(id: string, rating: number): Promise<Game>;
  toggleFavorite(id: string): Promise<Game>;
  removeGame(id: string): Promise<void>;
};
const EMPTY_GAMES: Game[] = [];
const EMPTY_PLATFORMS: GamePlatform[] = [];
const GamesContext = createContext<GamesContextValue | null>(null);

export function GamesProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const ownerId = auth.status === "authenticated" ? auth.user!.id : null;
  const revision = auth.revision;
  const [store] = useState(() => new GamesStore(gamesApi, localCovers, () => apiClient.sessionRevision));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => { store.setSession(ownerId, revision); }, [store, ownerId, revision]);
  useEffect(() => () => store.dispose(), [store]);

  // Hide data during the render that precedes the effect for a new session.
  const belongsToSession = !!ownerId && state.ownerId === ownerId && state.revision === revision;
  const games = belongsToSession ? state.games : EMPTY_GAMES;
  const platforms = belongsToSession ? state.platforms : EMPTY_PLATFORMS;
  const stats = useMemo<GameStats>(() => ({
    playing: games.filter(game => game.status === "playing").length,
    completed: games.filter(game => game.status === "completed").length,
    paused: games.filter(game => game.status === "paused").length,
    favorites: games.filter(game => game.favorite).length,
  }), [games]);
  const actions = useMemo(() => ({
    reload: () => store.reload(revision),
    getGame: (id: string) => store.getGame(id, revision),
    addGame: (input: CreateGameInput) => store.addGame(input, revision),
    updateGame: (id: string, input: UpdateGameInput) => store.updateGame(id, input, revision),
    setStatus: (id: string, status: GameStatus | null) => store.setStatus(id, status, revision),
    setRating: (id: string, rating: number) => store.setRating(id, rating, revision),
    toggleFavorite: (id: string) => store.toggleFavorite(id, revision),
    removeGame: (id: string) => store.removeGame(id, revision),
  }), [store, revision]);
  const value = useMemo<GamesContextValue>(() => ({
    games, platforms, stats, revision, ...actions,
    loading: !!ownerId && (!belongsToSession || state.loading),
    error: belongsToSession ? state.error : null,
    warning: belongsToSession ? state.warning : null,
  }), [games, platforms, stats, revision, actions, ownerId, belongsToSession, state.loading, state.error, state.warning]);
  return <GamesContext.Provider value={value}>{children}</GamesContext.Provider>;
}

export function useGames() {
  const context = useContext(GamesContext);
  if (!context) throw new Error("useGames precisa estar dentro do GamesProvider");
  return context;
}
