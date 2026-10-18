import type { ImageSource } from "expo-image";

export type GamePreset = {
  id: string;
  title: string;
  developer: string;
  genre: string;
  cover: ImageSource;
};

// Suggestions only: selecting a preset does not create a library entry.
export const GAME_PRESETS: readonly GamePreset[] = [
  { id: "elden-ring", title: "Elden Ring", developer: "FromSoftware", genre: "RPG", cover: require("../../assets/elden-ring.svg") },
  { id: "tlou-2", title: "The Last of Us Part II", developer: "Naughty Dog", genre: "Aventura", cover: require("../../assets/the-last-of-us-2.svg") },
  { id: "hollow-knight", title: "Hollow Knight", developer: "Team Cherry", genre: "Aventura", cover: require("../../assets/hollow-knight.svg") },
  { id: "god-of-war-ragnarok", title: "God of War Ragnarök", developer: "Santa Monica Studio", genre: "Ação", cover: require("../../assets/god-of-war-ragnarok.svg") },
  { id: "rdr2", title: "Red Dead Redemption 2", developer: "Rockstar Games", genre: "Aventura", cover: require("../../assets/red-dead-redemption-2.svg") },
  { id: "stardew-valley", title: "Stardew Valley", developer: "ConcernedApe", genre: "RPG", cover: require("../../assets/stardew-valley.svg") },
  { id: "cyberpunk", title: "Cyberpunk 2077", developer: "CD PROJEKT RED", genre: "RPG", cover: require("../../assets/cyberpunk.svg") },
];

export function findGamePreset(id: string | undefined): GamePreset | undefined {
  return GAME_PRESETS.find(preset => preset.id === id);
}

export function findPresetForGame(game: { title: string; developer: string | null }): GamePreset | undefined {
  const normalize = (value: string) => value.trim().toLowerCase();
  return GAME_PRESETS.find(preset => normalize(preset.title) === normalize(game.title)
    && game.developer !== null && normalize(preset.developer) === normalize(game.developer));
}
