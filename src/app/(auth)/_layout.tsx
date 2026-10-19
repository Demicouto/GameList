import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { SessionStatus } from "../../auth/SessionGate";

export default function AuthLayout() {
  const { status, cleanupPending } = useAuth();
  if (status === 'checking' || cleanupPending) return <SessionStatus />;
  if (status === 'authenticated') return <Redirect href="/home" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
