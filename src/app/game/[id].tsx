import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SelectField, type SelectOption } from "../../components/SelectField";
import { GameCover } from "../../components/GameCover";
import { GamesFeedback } from "../../components/GamesFeedback";
import { useGames } from "../../context/GamesContext";
import { useLibraryGame } from "../../hooks/useLibraryGame";
import { ApiError } from "../../services/api";
import { isLocalCoverUri } from "../../services/local-covers";
import type { GameStatus } from "../../types/game";

const STATUSES: SelectOption<GameStatus | "none">[] = [
  { value: "wishlist", label: "Quero jogar" }, { value: "playing", label: "Jogando" },
  { value: "paused", label: "Pausado" }, { value: "completed", label: "Concluído" },
  { value: "none", label: "Sem status" },
];

export default function GamePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { revision } = useGames();
  return <GameDetail key={`${revision}:${id}`} id={id} />;
}

function GameDetail({ id }: { id: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const record = useLibraryGame(id);
  const { setStatus, toggleFavorite, setRating, removeGame, warning } = useGames();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function run(action: () => Promise<unknown>, done?: () => void) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(null);
    try { await action(); if (mounted.current) done?.(); }
    catch (failure) { if (mounted.current) setError(failure instanceof ApiError ? failure.message : "Não foi possível alterar o jogo. Tente novamente."); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  }
  const game = record.game;
  if (record.loading || record.error) return <SafeAreaView className="flex-1 bg-[#111318]">
    <GamesFeedback loading={record.loading} error={record.error} retry={record.retry} />
    <Pressable onPress={() => router.replace("/library")} accessibilityRole="button" className="items-center p-4"><Text className="text-blue-400">Voltar à biblioteca</Text></Pressable>
  </SafeAreaView>;
  if (!game) return <SafeAreaView className="flex-1 items-center justify-center bg-[#111318] px-5">
    <StatusBar style="light" />
    <Ionicons name="game-controller-outline" size={48} color="#717B8D" />
    <Text className="mt-4 text-xl font-bold text-white">Jogo não encontrado</Text>
    <Text className="mt-2 text-center text-sm text-[#9CA3AF]">Este jogo não está disponível na sua biblioteca.</Text>
    <Pressable onPress={() => router.replace("/library")} accessibilityRole="button" className="mt-6 rounded-xl bg-blue-600 px-6 py-4"><Text className="font-bold text-white">Voltar à biblioteca</Text></Pressable>
  </SafeAreaView>;

  return (
    <View className="flex-1 bg-[#111318]">
      <StatusBar style="light" />
      <SafeAreaView edges={["left", "right"]} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
          <View style={{ height: 280 + insets.top }} className="overflow-hidden bg-[#1C2029]">
            <GameCover cover={game.cover} coverUrl={game.coverUrl} iconSize={72} />
            <LinearGradient pointerEvents="none" colors={["rgba(17,19,24,0.35)", "rgba(17,19,24,0.45)", "#111318"]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
            <View className="absolute left-5 right-5 flex-row items-center justify-between" style={{ top: insets.top + 12 }}>
              <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/library")} accessibilityRole="button" accessibilityLabel="Voltar"
                className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#111318]/80 active:opacity-80">
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </Pressable>
              <Pressable onPress={() => void run(() => toggleFavorite(game.id))} disabled={busy} accessibilityRole="button"
                accessibilityLabel={game.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} accessibilityState={{ selected: game.favorite, disabled: busy, busy }}
                className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#111318]/80 active:opacity-80">
                <Ionicons name={game.favorite ? "heart" : "heart-outline"} size={22} color={game.favorite ? "#F87171" : "#FFFFFF"} />
              </Pressable>
            </View>
          </View>
          <View className="gap-4 px-5">
            <Text accessibilityRole="header" className="text-[28px] font-extrabold tracking-[-0.6px] text-[#E5E7EB]">{game.title}</Text>
            {game.developer && <Text className="text-sm text-[#C1C6D5]">{game.developer}</Text>}
            <View className="flex-row flex-wrap gap-2">
              <View className="rounded-full bg-[#282A2E] px-3 py-1.5"><Text className="text-xs font-semibold text-[#ABC7FF]">{game.platform}</Text></View>
              {game.genre && <View className="rounded-full bg-[#282A2E] px-3 py-1.5"><Text className="text-xs font-semibold text-[#C1C6D5]">{game.genre}</Text></View>}
            </View>
            {error && <Text accessibilityRole="alert" className="text-sm text-red-400">{error}</Text>}
            {warning && <Text accessibilityRole="alert" className="text-sm text-amber-400">{warning}</Text>}
            <View className="flex-row items-center justify-between rounded-2xl bg-[#1E2024] p-3.5">
              <View className="flex-1">
                <Text className="text-xs font-semibold tracking-wider text-[#C1C6D5]">MINHA NOTA</Text>
                <View className="mt-1 flex-row" accessibilityRole="radiogroup" accessibilityLabel="Minha nota">
                  {[1, 2, 3, 4, 5].map(star => <Pressable key={star} disabled={busy} onPress={() => void run(() => setRating(game.id, star))}
                    accessibilityRole="radio" accessibilityState={{ checked: game.rating === star, disabled: busy }} accessibilityLabel={`${star} de 5 estrelas`}
                    className="min-h-11 flex-1 max-w-[40px] items-center justify-center active:opacity-70">
                    <Ionicons name={star <= (game.rating ?? 0) ? "star" : "star-outline"} size={24} color="#FFB657" />
                  </Pressable>)}
                </View>
              </View>
              <Text className="ml-2 text-[28px] font-extrabold text-[#E5E7EB]">{game.rating ?? "—"}<Text className="text-xs">/5</Text></Text>
            </View>
            <SelectField label="STATUS" value={game.status ?? "none"} options={STATUSES} disabled={busy}
              onChange={status => void run(() => setStatus(game.id, status === "none" ? null : status))} />
            {isLocalCoverUri(game.cover?.uri) && <Text className="text-xs text-[#9CA3AF]">Esta capa está disponível somente neste dispositivo.</Text>}
            <Pressable disabled={busy} onPress={() => router.push({ pathname: "/game/add", params: { editId: game.id } })} accessibilityRole="button"
              className="min-h-[52px] items-center justify-center rounded-xl bg-blue-600 px-4 py-3.5 active:opacity-85"><Text className="font-bold text-white">Editar jogo</Text></Pressable>
            <Pressable disabled={busy} onPress={() => setConfirmDelete(true)} accessibilityRole="button"
              className="min-h-[52px] items-center justify-center rounded-xl border border-red-400/40 px-4 py-3.5 active:opacity-85"><Text className="font-bold text-red-400">Excluir jogo</Text></Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
      <Modal visible={confirmDelete} transparent animationType="fade" onRequestClose={() => { if (!busy) setConfirmDelete(false); }}>
        <View className="flex-1 justify-end bg-black/60">
          <View accessibilityViewIsModal className="gap-4 rounded-t-[28px] bg-[#171A22] p-5" style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
            <Text className="text-xl font-bold text-white">Excluir este jogo?</Text>
            <Text className="text-base text-[#9CA3AF]">O jogo será removido da sua biblioteca. Essa ação não pode ser desfeita.</Text>
            {error && <Text accessibilityRole="alert" className="text-sm text-red-400">{error}</Text>}
            <Pressable disabled={busy} onPress={() => void run(() => removeGame(game.id), () => router.replace("/library"))}
              accessibilityRole="button" accessibilityLabel="Confirmar exclusão" accessibilityState={{ disabled: busy, busy }} className="items-center rounded-2xl bg-red-600 p-4">
              <Text className="font-bold text-white">{busy ? "Excluindo…" : "Confirmar exclusão"}</Text>
            </Pressable>
            <Pressable disabled={busy} onPress={() => setConfirmDelete(false)} accessibilityRole="button" className="items-center p-4"><Text className="font-bold text-white">Cancelar</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
