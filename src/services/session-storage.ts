import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export interface SessionStorage {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  clear(): Promise<void>;
}

const SESSION_KEY = "gamelist.session";
const OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export function createSessionStorage(platform: "web" | "native"): SessionStorage {
  return {
    async read() {
      return platform === "web" ? null : SecureStore.getItemAsync(SESSION_KEY, OPTIONS);
    },
    async write(token) {
      if (platform !== "web") await SecureStore.setItemAsync(SESSION_KEY, token, OPTIONS);
    },
    async clear() {
      if (platform !== "web") await SecureStore.deleteItemAsync(SESSION_KEY, OPTIONS);
    },
  };
}

export const sessionStorage = createSessionStorage(Platform.OS === "web" ? "web" : "native");
