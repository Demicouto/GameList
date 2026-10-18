import WelcomeScreen from "../components/WelcomeScreen";
import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { SessionStatus } from "../auth/SessionGate";

export default function Index() {
  const { status, cleanupPending } = useAuth();
  if (status === 'checking' || status === 'restore-error' || cleanupPending) return <SessionStatus />;
  if (status === 'authenticated') return <Redirect href="/home" />;
  return <WelcomeScreen />;
}
