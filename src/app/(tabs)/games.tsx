import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { GameCard } from "../../components/GameCard";
import { GameStatusSheet } from "../../components/GameStatusSheet";
import { GamesFeedback } from "../../components/GamesFeedback";
import { useGames } from "../../context/GamesContext";

const PADDING = 20;
const GAP = 16;

export function GamesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { games, loading, error, warning, reload } = useGames();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cardWidth = (width - PADDING * 2 - GAP) / 2;

  return (
    <View className="flex-1 bg-[#111318]">
      <StatusBar style="light" />

      <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
        <FlatList
          data={games}
          keyExtractor={(g) => g.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{
            paddingHorizontal: PADDING,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
            gap: 24,
          }}
          ListHeaderComponent={
            <View className="mb-2">
              <Pressable
                onPress={() => router.canGoBack() ? router.back() : router.replace("/home")}
                className="h-11 w-11 items-center justify-center rounded-full border border-[#252C3C] bg-[#181D28] active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel="Voltar"
              >
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </Pressable>

              <Text className="mt-6 text-[32px] font-extrabold tracking-[-0.5px] text-[#E5E7EB]">
                Meus jogos
              </Text>
              <Text className="mt-1 text-base text-[#9CA3AF]">
                {loading || error ? "Sua coleção de jogos" : `${games.length} jogos na sua biblioteca`}
              </Text>
              {games.length > 0 && (loading || error || warning) && <GamesFeedback loading={loading} error={error} warning={warning} retry={() => void reload()} />}
            </View>
          }
          ListEmptyComponent={<GamesFeedback loading={loading} error={error} warning={warning} empty retry={() => void reload()} onAdd={() => router.push("/game/add")} />}
          renderItem={({ item }) => (
            <GameCard
              game={item}
              width={cardWidth}
              onPress={() =>
                router.push({
                  pathname: "/game/[gamesid]",
                  params: { gamesid: item.id },
                })
              }
              onBadgePress={() => setSelectedId(item.id)}
            />
          )}
        />
      </SafeAreaView>

      <GameStatusSheet
        gameId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </View>
  );
}

export default GamesScreen;
