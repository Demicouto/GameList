import { ApiError, apiClient, type ApiClient } from "./api";
import type { ApiGameStatus, CreateGameInput, Game, GameMetadataInput, GamePlatform, GameStatus } from "../types/game";

const STATUSES: Record<ApiGameStatus, GameStatus> = {
  PLAYING: "playing", COMPLETED: "completed", PAUSED: "paused", WISHLIST: "wishlist",
};
const TO_API: Record<GameStatus, ApiGameStatus> = {
  playing: "PLAYING", completed: "COMPLETED", paused: "PAUSED", wishlist: "WISHLIST",
};
function invalid(): never { throw new ApiError(502, "A API retornou dados de jogos inválidos.", "invalid-response"); }
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export function isRemoteCoverUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}
function platform(value: unknown): GamePlatform {
  if (!record(value) || !Number.isInteger(value.id) || (value.id as number) < 1 || typeof value.name !== "string" || !value.name.trim()) return invalid();
  return { id: value.id as number, name: value.name };
}
export function mapGame(value: unknown): Game {
  if (!record(value) || typeof value.id !== "string" || !value.id || typeof value.title !== "string"
    || !(value.developer === null || typeof value.developer === "string") || !(value.genre === null || typeof value.genre === "string")
    || !(value.status === null || typeof value.status === "string" && Object.hasOwn(STATUSES, value.status))
    || !(value.rating === null || Number.isInteger(value.rating) && (value.rating as number) >= 0 && (value.rating as number) <= 5)
    || typeof value.favorite !== "boolean" || !(value.coverUrl === null || isRemoteCoverUrl(value.coverUrl))
    || typeof value.createdAt !== "string" || !Number.isFinite(Date.parse(value.createdAt))
    || typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt))) return invalid();
  const itemPlatform = platform(value.platform);
  if (value.platformId !== itemPlatform.id) return invalid();
  return {
    id: value.id, title: value.title, developer: value.developer as string | null, genre: value.genre as string | null,
    status: value.status === null ? null : STATUSES[value.status as ApiGameStatus], rating: value.rating as number | null,
    favorite: value.favorite, coverUrl: value.coverUrl as string | null,
    cover: value.coverUrl ? { uri: value.coverUrl as string } : undefined,
    platformId: itemPlatform.id, platform: itemPlatform.name, createdAt: value.createdAt, updatedAt: value.updatedAt,
  };
}
function metadata(input: Partial<GameMetadataInput>) {
  if (input.coverUrl != null && !isRemoteCoverUrl(input.coverUrl)) throw new ApiError(400, "A capa enviada à API deve usar uma URL HTTP(S).");
  const result: Partial<GameMetadataInput> = {};
  for (const key of ["title", "platformId", "developer", "genre", "coverUrl"] as const) {
    if (input[key] !== undefined) Object.assign(result, { [key]: input[key] });
  }
  return result;
}
export function createGamesApi(client: Pick<ApiClient, "request">) {
  const path = (id: string) => `/games/${encodeURIComponent(id)}`;
  return {
    async list(signal?: AbortSignal) {
      const value = await client.request<unknown>("/games", { signal });
      if (!Array.isArray(value)) return invalid();
      return value.map(mapGame);
    },
    async get(id: string, signal?: AbortSignal) { return mapGame(await client.request(path(id), { signal })); },
    async platforms(signal?: AbortSignal) {
      const value = await client.request<unknown>("/platforms", { signal });
      if (!Array.isArray(value)) return invalid();
      return value.map(platform);
    },
    async create(input: CreateGameInput, signal?: AbortSignal) {
      const body = { ...metadata(input),
        ...(input.status !== undefined ? { status: input.status === null ? null : TO_API[input.status] } : {}),
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
      };
      return mapGame(await client.request("/games", { method: "POST", body, signal }));
    },
    async update(id: string, input: Partial<GameMetadataInput>, signal?: AbortSignal) {
      return mapGame(await client.request(path(id), { method: "PATCH", body: metadata(input), signal }));
    },
    async status(id: string, status: GameStatus | null, signal?: AbortSignal) {
      return mapGame(await client.request(`${path(id)}/status`, { method: "PATCH", body: { status: status === null ? null : TO_API[status] }, signal }));
    },
    async favorite(id: string, signal?: AbortSignal) { return mapGame(await client.request(`${path(id)}/favorite`, { method: "PATCH", signal })); },
    async rating(id: string, rating: number, signal?: AbortSignal) { return mapGame(await client.request(`${path(id)}/rating`, { method: "PATCH", body: { rating }, signal })); },
    async remove(id: string, signal?: AbortSignal) { await client.request<void>(path(id), { method: "DELETE", signal }); },
  };
}
export type GamesApi = ReturnType<typeof createGamesApi>;
export const gamesApi = createGamesApi(apiClient);
