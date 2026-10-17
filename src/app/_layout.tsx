import "../global.css";

import { Stack } from "expo-router";
import { GamesProvider } from "../context/GamesContext";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <GamesProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="game" />
        </Stack>
      </GamesProvider>
    </AuthProvider>
  );
}
