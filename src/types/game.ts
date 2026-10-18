import type { ImageSource } from "expo-image";

export type GameStatus = "playing" | "completed" | "paused" | "wishlist";
export type ApiGameStatus = "PLAYING" | "COMPLETED" | "PAUSED" | "WISHLIST";
export type GamePlatform = { id: number; name: string };

export type ApiGame = {
  id: string;
  title: string;
  developer: string | null;
  genre: string | null;
  status: ApiGameStatus | null;
  rating: number | null;
  favorite: boolean;
  coverUrl: string | null;
  platformId: number;
  platform: GamePlatform;
  createdAt: string;
  updatedAt: string;
};

export type Game = Omit<ApiGame, "status" | "platform"> & {
  platform: string;
  status: GameStatus | null;
  cover?: ImageSource;
  localCoverReference?: string;
};

export type GameMetadataInput = {
  title: string;
  platformId: number;
  developer?: string | null;
  genre?: string | null;
  coverUrl?: string | null;
};
export type CreateGameInput = GameMetadataInput & {
  status?: GameStatus | null;
  rating?: number | null;
  localCover?: string | null;
};
export type UpdateGameInput = Partial<GameMetadataInput> & {
  status?: GameStatus | null;
  localCover?: string | null;
};
