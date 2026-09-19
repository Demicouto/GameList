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
import { useGames } from "../../context/GamesContext";

const PADDING = 20;
const GAP = 16;

export function GamesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { games } = useGames();
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
                onPress={() => router.back()}
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
                {games.length} jogos na sua biblioteca
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <GameCard
              game={item}
              width={cardWidth}
              onPress={() =>
                router.push({ pathname: "/game/[id]", params: { id: item.id } })
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
