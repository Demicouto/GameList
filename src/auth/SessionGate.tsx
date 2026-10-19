import { Redirect } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import WelcomeScreen from '../components/WelcomeScreen';

export function SessionStatus() {
  const { status, error, cleanupPending, retryCleanup, retryRestore } = useAuth();
  const [busy, setBusy] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  async function retry() {
    if (busy) return;
    setBusy(true);
    try { await (cleanupPending ? retryCleanup() : retryRestore()); }
    catch { /* AuthContext supplies the error and permits another attempt. */ }
    finally { setBusy(false); }
  }
  if (showWelcome) return <WelcomeScreen />;
  const checking = status === 'checking' && !cleanupPending;
  return (
    <View className="flex-1 items-center justify-center gap-5 bg-[#0A0D14] px-6">
      {checking || busy ? <ActivityIndicator size="large" color="#3B82F6" /> : null}
      <Text className="text-center text-base text-white" accessibilityRole={checking ? undefined : 'alert'}>
        {checking ? 'Restaurando sessão…' : error ?? 'Não foi possível restaurar sua sessão.'}
      </Text>
      {!checking && (
        <>
          <Pressable onPress={retry} disabled={busy} accessibilityRole="button"
            className="rounded-2xl bg-blue-600 px-6 py-4"
            accessibilityState={{ disabled: busy, busy }}>
            <Text className="font-bold text-white">
              {cleanupPending ? 'Limpar sessão do dispositivo' : 'Tentar novamente'}
            </Text>
          </Pressable>
          {status === 'restore-error' && !cleanupPending && (
            <Pressable onPress={() => setShowWelcome(true)} accessibilityRole="button"
              className="rounded-2xl border border-white/20 px-6 py-4">
              <Text className="font-bold text-white">Voltar à tela de boas-vindas</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

export function SessionGate({ children }: { children: ReactNode }) {
  const { status, cleanupPending } = useAuth();
  if (status === 'checking' || status === 'restore-error' || cleanupPending) return <SessionStatus />;
  if (status === 'anonymous') {
    return <Redirect href="/login" />;
  }
  return children;
}
