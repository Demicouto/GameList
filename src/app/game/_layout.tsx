import { Stack } from 'expo-router';
import { SessionGate } from '../../auth/SessionGate';

export default function GameLayout() {
  return <SessionGate><Stack screenOptions={{ headerShown: false }} /></SessionGate>;
}
