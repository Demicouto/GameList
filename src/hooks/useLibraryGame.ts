import { useCallback, useEffect, useState } from "react";
import { useGames } from "../context/GamesContext";
import { ApiError } from "../services/api";

export function useLibraryGame(id: string | undefined) {
  const { games, loading, error, getGame, reload, revision } = useGames();
  const [attempt, setAttempt] = useState(0);
  const key = `${revision}:${id ?? ""}`;
  const [request, setRequest] = useState({ key: "", loading: false, error: null as string | null, missing: false });
  useEffect(() => {
    if (!id || loading || error) return;
    let active = true;
    setRequest({ key, loading: true, error: null, missing: false });
    void getGame(id).then(() => {
      if (active) setRequest({ key, loading: false, error: null, missing: false });
    }).catch((failure: unknown) => {
      if (!active) return;
      const missing = failure instanceof ApiError && failure.status === 404;
      setRequest({ key, loading: false, missing, error: missing ? null : failure instanceof ApiError ? failure.message : "Não foi possível carregar o jogo. Tente novamente." });
    });
    return () => { active = false; };
  }, [id, key, loading, error, getGame, attempt]);
  const retry = useCallback(() => { if (error) void reload(); else setAttempt(value => value + 1); }, [error, reload]);
  if (!id) return { game: undefined, loading: false, error: null, missing: false, retry };
  const current = request.key === key;
  const busy = !error && (loading || !current || request.loading);
  const game = !busy && !error && current && !request.error && !request.missing ? games.find(game => game.id === id) : undefined;
  return { game, loading: busy, error: error ?? (current ? request.error : null), missing: !busy && !error && current && !request.error && !game, retry };
}
