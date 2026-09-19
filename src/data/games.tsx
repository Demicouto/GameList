import type { ImageSource } from "expo-image";

export type GamePlatform =
  | "PS5"
  | "PS4"
  | "PC"
  | "Xbox"
  | "Xbox Series X|S"
  | "Xbox One"
  | "Switch"
  | "Mobile";
export type GameStatus = "playing" | "completed" | "paused" | "wishlist";

export type Game = {
  id: string;
  title: string;
  developer: string;
  genre?: string;
  platform: GamePlatform;
  status?: GameStatus;
  favorite?: boolean;
  cover?: ImageSource;
  publisher?: string;
  tags?: string[];
  award?: string;
  rating?: number;
  progress?: number;
  hoursPlayed?: number;
  achievements?: { unlocked: number; total: number; latest?: string };
};

export const GAMES: Game[] = [
  {
    id: "elden-ring",
    genre: "RPG",
    publisher: "Bandai Namco",
    tags: ["RPG de Ação", "Mundo Aberto", "Soulsborne"],
    award: "GotY 2022",
    rating: 5,
    progress: 80,
    hoursPlayed: 52,
    achievements: {
      unlocked: 24,
      total: 42,
      latest: "Lorde Prístino da Térvore",
    },
    title: "Elden Ring",
    developer: "FromSoftware",
    platform: "PS5",
    status: "playing",
    cover: require("../../assets/elden-ring.svg"),
  },
  {
    id: "tlou-2",
    title: "The Last of Us Part II",
    developer: "Naughty Dog",
    platform: "PS4",
    status: "completed",
    cover: require("../../assets/the-last-of-us-2.svg"),
  },
  {
    id: "hollow-knight",
    title: "Hollow Knight",
    developer: "Team Cherry",
    platform: "PC",
    status: "paused",
    cover: require("../../assets/hollow-knight.svg"),
  },
  {
    id: "god-of-war-ragnarok",
    title: "God of War Ragnarök",
    developer: "Santa Monica Studio",
    platform: "PS5",
    status: "playing",
    cover: require("../../assets/god-of-war-ragnarok.svg"),
  },
  {
    id: "rdr2",
    title: "Red Dead Redemption 2",
    developer: "Rockstar Games",
    platform: "PS4",
    status: "paused",
    cover: require("../../assets/red-dead-redemption-2.svg"),
  },
  {
    id: "stardew-valley",
    title: "Stardew Valley",
    developer: "ConcernedApe",
    platform: "PC",
    status: "playing",
    cover: require("../../assets/stardew-valley.svg"),
  },
  {
    id: "cyberpunk",
    title: "Cyberpunk 2077 ",
    developer: "CD PROJEKT RED",
    platform: "PS4",
    status: "completed",
    cover: require("../../assets/cyberpunk.svg"),
  },
];

export const FEATURED = {
  title: "God of War Ragnarök",
  platform: "PS5" as GamePlatform,
  chapter: "Capítulo 12",
  progress: 68,
  banner: require("../../assets/god-of-war-ragnarok-banner.svg") as ImageSource,
};

export type Achievement = {
  id: string;
  title: string;
  game: string;
  time: string;
  xp: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "a1",
    title: "Guerra dos Deuses",
    game: "God of War Ragnarök",
    time: "há 2h",
    xp: 50,
  },
  {
    id: "a2",
    title: "Sobrevivente",
    game: "The Last of Us II",
    time: "há 5h",
    xp: 30,
  },
  {
    id: "a3",
    title: "Cavaleiro do Vazio",
    game: "Hollow Knight",
    time: "há 8h",
    xp: 80,
  },
];
