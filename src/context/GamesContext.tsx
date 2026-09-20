import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { GAMES as INITIAL_GAMES } from "../data/games";
import type { Game, GameStatus } from "../data/games";

export type StatKey = "playing" | "completed" | "paused" | "favorites";
export type GameStats = Record<StatKey, number>;

type GamesContextValue = {
  games: Game[];
  stats: GameStats;
  addGame: (game: Game) => void;
  updateGame: (id: string, changes: Partial<Omit<Game, "id">>) => void;
  setStatus: (id: string, status?: GameStatus) => void;
  toggleFavorite: (id: string) => void;
};

const GamesContext = createContext<GamesContextValue | null>(null);

export function GamesProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);

  const stats = useMemo<GameStats>(
    () => ({
      playing: games.filter((g) => g.status === "playing").length,
      completed: games.filter((g) => g.status === "completed").length,
      paused: games.filter((g) => g.status === "paused").length,
      favorites: games.filter((g) => g.favorite).length,
    }),
    [games],
  );

  const addGame = useCallback((game: Game) => {
    setGames((prev) => [game, ...prev]);
  }, []);

  const setStatus = useCallback((id: string, status?: GameStatus) => {
    setGames((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setGames((prev) =>
      prev.map((g) => (g.id === id ? { ...g, favorite: !g.favorite } : g)),
    );
  }, []);

  const updateGame = useCallback(
    (id: string, changes: Partial<Omit<Game, "id">>) => {
      setGames((prev) =>
        prev.map((game) => (game.id === id ? { ...game, ...changes } : game)),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({ games, stats, addGame, updateGame, setStatus, toggleFavorite }),
    [games, stats, addGame, updateGame, setStatus, toggleFavorite],
  );

  return (
    <GamesContext.Provider value={value}>{children}</GamesContext.Provider>
  );
}

export function useGames() {
  const ctx = useContext(GamesContext);
  if (!ctx) {
    throw new Error("useGames precisa estar dentro do GamesProvider");
  }
  return ctx;
}
