import { Stack } from "expo-router";
import { SessionGate } from "../../auth/SessionGate";

export default function TabsLayout() {
  return <SessionGate><Stack screenOptions={{ headerShown: false }} /></SessionGate>;
}
