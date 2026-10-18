import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { GameCard } from "../../components/GameCard";
import { GameStatusSheet } from "../../components/GameStatusSheet";
import SearchBar from "../../components/SearchBar";
import { useGames } from "../../context/GamesContext";
import type { GameStatus } from "../../types/game";
import { GamesFeedback } from "../../components/GamesFeedback";

type LibraryFilter = "all" | "favorites" | GameStatus;

const FILTERS: { key: LibraryFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "all", label: "Todos", icon: "library-outline" },
  { key: "playing", label: "Jogando", icon: "game-controller-outline" },
  { key: "completed", label: "Concluídos", icon: "checkmark-circle-outline" },
  { key: "paused", label: "Pausados", icon: "pause-circle-outline" },
  { key: "wishlist", label: "Desejados", icon: "bookmark-outline" },
  { key: "favorites", label: "Favoritos", icon: "heart-outline" },
];

const PADDING = 20;
const GAP = 16;
const MAX_WIDTH = 760;

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export default function LibraryPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { games, loading, error, warning, reload } = useGames();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const contentWidth = Math.min(width - insets.left - insets.right, MAX_WIDTH);
  const cardWidth = (contentWidth - PADDING * 2 - GAP) / 2;

  const filteredGames = useMemo(() => {
    const search = normalizeSearch(query);
    return games.filter((game) => {
      const matchesFilter = filter === "all" || (filter === "favorites" ? game.favorite : game.status === filter);
      return matchesFilter && normalizeSearch(game.title).includes(search);
    });
  }, [games, query, filter]);

  function clearFilters() {
    setQuery("");
    setFilter("all");
  }

  const isEmptyLibrary = games.length === 0;
  const hasFilters = query.trim().length > 0 || filter !== "all";

  return (
    <View className="flex-1 bg-[#111318]">
      <StatusBar style="light" />
      <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
        <FlatList
          data={filteredGames}
          keyExtractor={(game) => game.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{
            width: "100%",
            maxWidth: MAX_WIDTH,
            alignSelf: "center",
            paddingHorizontal: PADDING,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
            gap: 24,
            flexGrow: 1,
          }}
          ListHeaderComponent={
            <View>
              <View className="flex-row items-center justify-between">
                <Pressable
                  onPress={() => router.replace("/home")}
                  accessibilityRole="button"
                  accessibilityLabel="Voltar ao início"
                  className="h-11 w-11 items-center justify-center rounded-full border border-[#252C3C] bg-[#181D28] active:opacity-80"
                >
                  <Ionicons name="chevron-back" size={22} color="#FFFFFF" accessible={false} />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/game/add")}
                  accessibilityRole="button"
                  accessibilityLabel="Adicionar jogo"
                  className="h-11 w-11 items-center justify-center rounded-full bg-blue-600 active:opacity-80"
                >
                  <Ionicons name="add" size={26} color="#FFFFFF" accessible={false} />
                </Pressable>
              </View>

              <Text accessibilityRole="header" className="mt-6 text-[32px] font-extrabold tracking-[-0.5px] text-[#E5E7EB]">
                Minha biblioteca
              </Text>
              <Text className="mb-6 mt-1 text-base text-[#9CA3AF]">
                {loading || error ? "Sua coleção de jogos" : `${games.length} ${games.length === 1 ? "jogo" : "jogos"} na biblioteca`}
              </Text>
              {(games.length > 0 || (!loading && !error)) && (loading || error || warning) && <GamesFeedback loading={loading} error={error} warning={warning} retry={() => void reload()} />}

              <SearchBar value={query} onChangeText={setQuery} />

              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled" className="mt-4"
                contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                {FILTERS.map((item) => {
                  const active = filter === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => setFilter(item.key)}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                      accessibilityState={{ selected: active }}
                      className={`h-11 flex-row items-center gap-2 rounded-full border px-4 active:opacity-80 ${
                        active ? "border-blue-600 bg-blue-600" : "border-[#252C3C] bg-[#181D28]"
                      }`}
                    >
                      <Ionicons name={item.icon} size={18} color={active ? "#FFFFFF" : "#9CA3AF"} accessible={false} />
                      <Text className={`text-sm font-semibold ${active ? "text-white" : "text-[#9CA3AF]"}`}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View className="mt-6 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-[#E5E7EB]">
                  {hasFilters ? "Resultados" : "Todos os jogos"}
                </Text>
                <Text accessibilityLiveRegion="polite" className="text-sm text-[#9CA3AF]">
                  {filteredGames.length} {filteredGames.length === 1 ? "jogo" : "jogos"}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            loading || error ? <GamesFeedback loading={loading} error={error} warning={warning} retry={() => void reload()} /> :
            <View className="items-center px-3 py-12">
              <View className="mb-5 h-20 w-20 items-center justify-center rounded-3xl border border-[#252C3C] bg-[#181D28]">
                <Ionicons name={isEmptyLibrary ? "library-outline" : "search-outline"} size={34} color="#60A5FA" accessible={false} />
              </View>
              <Text className="text-center text-xl font-bold text-white">
                {isEmptyLibrary ? "Sua biblioteca está vazia" : "Nenhum jogo encontrado"}
              </Text>
              <Text className="mt-2 text-center text-base leading-6 text-[#9CA3AF]">
                {isEmptyLibrary ? "Adicione seu primeiro jogo para começar." : "Tente outro nome ou ajuste os filtros."}
              </Text>
              <Pressable
                onPress={isEmptyLibrary ? () => router.push("/game/add") : clearFilters}
                accessibilityRole="button"
                className="mt-6 min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 active:opacity-80"
              >
                <Text className="text-base font-bold text-white">
                  {isEmptyLibrary ? "Adicionar primeiro jogo" : "Limpar busca e filtros"}
                </Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <GameCard
              game={item}
              width={cardWidth}
              onPress={() => router.push({ pathname: "/game/[gamesid]", params: { gamesid: item.id } })}
              onBadgePress={() => setSelectedId(item.id)}
            />
          )}
        />
      </SafeAreaView>
      <GameStatusSheet gameId={selectedId} onClose={() => setSelectedId(null)} />
    </View>
  );
}
