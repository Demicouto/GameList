import "../global.css";

import { Stack } from "expo-router";
import { GamesProvider } from "../context/GamesContext";

export default function RootLayout() {
  return (
    <GamesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" />
      </Stack>
    </GamesProvider>
  );
}
