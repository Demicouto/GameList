import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ImageSource } from "expo-image";
import { findGamePreset } from "../data/game-presets";

type CoverStorage = Pick<typeof AsyncStorage, "getItem" | "setItem" | "removeItem">;
export function isLocalCoverUri(value: unknown): value is string {
  return typeof value === "string" && /^(file:\/\/|content:\/\/|blob:|data:image\/)/i.test(value);
}
export function resolveLocalCover(value: string): ImageSource | undefined {
  if (value.startsWith("preset:")) return findGamePreset(value.slice(7))?.cover;
  return isLocalCoverUri(value) ? { uri: value } : undefined;
}
export function createLocalCovers(storage: CoverStorage) {
  const key = (userId: string, gameId: string) => `gamelist.covers.v1:${encodeURIComponent(userId)}:${encodeURIComponent(gameId)}`;
  const queues = new Map<string, Promise<void>>();
  function serial<T>(cacheKey: string, action: () => Promise<T>): Promise<T> {
    const result = (queues.get(cacheKey) ?? Promise.resolve()).then(action);
    const tail = result.then(() => undefined, () => undefined);
    queues.set(cacheKey, tail);
    void tail.then(() => { if (queues.get(cacheKey) === tail) queues.delete(cacheKey); });
    return result;
  }
  return {
    async read(userId: string, gameId: string): Promise<string | null> {
      const cacheKey = key(userId, gameId);
      const value = await serial(cacheKey, () => storage.getItem(cacheKey));
      return typeof value === "string" && (value === "none" || resolveLocalCover(value) !== undefined) ? value : null;
    },
    async write(userId: string, gameId: string, uri: string) {
      if (uri !== "none" && resolveLocalCover(uri) === undefined) throw new Error("A capa deve ser um arquivo do dispositivo ou um predefinido válido.");
      const cacheKey = key(userId, gameId);
      await serial(cacheKey, () => storage.setItem(cacheKey, uri));
    },
    async remove(userId: string, gameId: string) {
      const cacheKey = key(userId, gameId);
      await serial(cacheKey, () => storage.removeItem(cacheKey));
    },
  };
}
export type LocalCovers = ReturnType<typeof createLocalCovers>;
export const localCovers = createLocalCovers(AsyncStorage);
