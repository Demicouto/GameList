import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/api';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);

  async function handleLogout() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(null);
    try { await logout(); }
    catch (error) { setError(error instanceof ApiError ? error.message : 'Não foi possível sair. Tente novamente.'); }
    finally { pending.current = false; setBusy(false); }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0D14]">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="mx-auto w-full max-w-[480px] gap-5">
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar ao início"
            className="h-11 w-11 items-center justify-center rounded-full border border-[#252C3C] bg-[#181D28] active:opacity-80" onPress={() => router.replace('/home')}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" accessible={false} />
          </Pressable>
          <Text className="text-[32px] font-extrabold text-white">Meu perfil</Text>
          <View className="gap-3 rounded-3xl border border-[#252C3C] bg-[#141822] p-5">
            <Text className="text-2xl font-bold text-white">{user?.name}</Text>
            {user?.username && <Text className="text-base text-blue-400">@{user.username}</Text>}
            <Text className="text-base text-[#9CA3AF]">{user?.email}</Text>
          </View>
          {error && <Text accessibilityRole="alert" className="text-sm text-red-400">{error}</Text>}
          <Pressable onPress={handleLogout} disabled={busy} accessibilityRole="button"
            accessibilityLabel="Sair da conta" accessibilityState={{ disabled: busy, busy }}
            className="items-center rounded-2xl bg-blue-600 p-4">
            <Text className="text-base font-bold text-white">{busy ? 'Saindo…' : 'Sair da conta'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
