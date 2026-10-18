import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { GameCard } from "../../components/GameCard";
import { GameCover } from "../../components/GameCover";
import { GameStatusSheet } from "../../components/GameStatusSheet";
import { GamesFeedback } from "../../components/GamesFeedback";
import { AddGameSheet } from "../../components/AddGameSheet";
import { useGames, type StatKey } from "../../context/GamesContext";
import { useAuth } from "../../context/AuthContext";

const STATS: { key: StatKey; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; box: string }[] = [
  { key: "playing", label: "Jogando", icon: "game-controller-outline", color: "#60A5FA", box: "bg-[#12233A]" },
  { key: "completed", label: "Concluídos", icon: "checkmark-circle-outline", color: "#34D399", box: "bg-[#0F2A24]" },
  { key: "paused", label: "Pausados", icon: "pause-circle-outline", color: "#FBBF24", box: "bg-[#2B2010]" },
  { key: "favorites", label: "Favoritos", icon: "heart", color: "#F87171", box: "bg-[#2B141C]" },
];

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { games, stats, loading, error, warning, reload } = useGames();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingGame, setAddingGame] = useState(false);
  const featured = games.find(game => game.status === "playing") ?? games[0];
  return (
    <View className="flex-1 bg-[#111318]">
      <StatusBar style="light" />
      <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
          <View className="flex-row items-center justify-between px-5 pt-4">
            <View className="flex-1 pr-4">
              <Text className="text-[32px] font-extrabold tracking-[-0.5px] text-[#E5E7EB]">Olá, {user?.name}</Text>
              <Text className="mt-0.5 text-base text-[#9CA3AF]">Pronto para jogar hoje?</Text>
            </View>
            <Pressable onPress={() => router.push("/profile")} accessibilityRole="button" accessibilityLabel="Abrir meu perfil"
              className="h-11 w-11 items-center justify-center rounded-full border-2 border-[#243149] bg-[#181D28] active:opacity-80">
              <Ionicons name="person-outline" size={22} color="#E5E7EB" />
            </Pressable>
          </View>
          {(loading || error || warning || games.length === 0) && <GamesFeedback loading={loading} error={error} warning={warning}
            empty={games.length === 0} retry={() => void reload()} onAdd={() => router.push("/game/add")} />}
          {!loading && !error && <>
            {featured && <View className="mx-5 mt-5 h-[208px] overflow-hidden rounded-[28px] bg-[#1C2029]">
              <GameCover cover={featured.cover} coverUrl={featured.coverUrl} />
              <LinearGradient pointerEvents="none" colors={["transparent", "rgba(17,19,24,0.95)"]} style={StyleSheet.absoluteFill} />
              <View className="absolute bottom-4 left-5 right-5 flex-row items-end justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-sky-400">{featured.status === "playing" ? "Continue jogando" : "Da sua biblioteca"}</Text>
                  <Text numberOfLines={1} className="mt-1 text-[26px] font-extrabold text-white">{featured.title}</Text>
                  <Text className="mt-2 text-sm font-semibold text-[#D1D5DB]">{featured.platform}</Text>
                </View>
                <Pressable onPress={() => router.push({ pathname: "/game/[id]", params: { id: featured.id } })}
                  accessibilityRole="button" accessibilityLabel={`Abrir ${featured.title}`}
                  className="h-14 w-14 items-center justify-center rounded-full bg-blue-500 active:opacity-85">
                  <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>}
            <View className="mt-5 flex-row gap-2.5 px-5">
              {STATS.map(item => <View key={item.key} className="flex-1 items-center rounded-2xl bg-[#171A22] px-1 py-4">
                <View className={`h-10 w-10 items-center justify-center rounded-xl ${item.box}`}><Ionicons name={item.icon} size={22} color={item.color} /></View>
                <Text className="mt-2 text-[30px] font-extrabold text-[#E5E7EB]">{stats[item.key]}</Text>
                <Text className="text-[13px] text-[#9CA3AF]">{item.label}</Text>
              </View>)}
            </View>
            {games.length > 0 && <>
              <View className="mt-7 flex-row items-center justify-between px-5">
                <Text className="text-xl font-bold text-[#E5E7EB]">Meus jogos</Text>
                <Pressable onPress={() => router.push("/games")} accessibilityRole="link" hitSlop={8}><Text className="font-semibold text-sky-400">Ver todos</Text></Pressable>
              </View>
              <FlatList horizontal data={games} keyExtractor={game => game.id} showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14 }} ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
                renderItem={({ item }) => <GameCard game={item} width={128}
                  onPress={() => router.push({ pathname: "/game/[id]", params: { id: item.id } })} onBadgePress={() => setSelectedId(item.id)} />} />
            </>}
          </>}
        </ScrollView>
      </SafeAreaView>
      <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-around border-t border-white/5 bg-[#161A22] px-2 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <NavItem label="Início" icon="home" active onPress={() => router.replace("/home")} />
        <NavItem label="Biblioteca" icon="library-outline" onPress={() => router.push("/library")} />
        <Pressable onPress={() => setAddingGame(true)} accessibilityRole="button" accessibilityLabel="Adicionar jogo"
          className="-mt-8 h-14 w-14 items-center justify-center rounded-full bg-blue-500 active:opacity-85"><Ionicons name="add" size={30} color="#FFFFFF" /></Pressable>
        <NavItem label="Descobrir" icon="compass-outline" onPress={() => router.push("/search")} />
        <NavItem label="Perfil" icon="person-circle-outline" onPress={() => router.push("/profile")} />
      </View>
      <GameStatusSheet gameId={selectedId} onClose={() => setSelectedId(null)} />
      {addingGame && <AddGameSheet onClose={() => setAddingGame(false)} />}
    </View>
  );
}
function NavItem({ label, icon, active, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; active?: boolean; onPress: () => void }) {
  const color = active ? "#3B82F6" : "#9CA3AF";
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} className="items-center active:opacity-70">
    <Ionicons name={icon} size={24} color={color} /><Text className="mt-1 text-xs font-medium" style={{ color }}>{label}</Text>
  </Pressable>;
}
export default HomeScreen;
