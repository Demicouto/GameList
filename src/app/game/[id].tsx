import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SelectField, type SelectOption } from "../../components/SelectField";
import { useGames } from "../../context/GamesContext";
import type { GameStatus } from "../../data/games";

const STATUSES: SelectOption<GameStatus | "none">[] = [
  { value: "wishlist", label: "Quero jogar" },
  { value: "playing", label: "Jogando" },
  { value: "paused", label: "Pausado" },
  { value: "completed", label: "Concluído" },
  { value: "none", label: "Sem status" },
];

export default function GamePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { games, updateGame, setStatus, toggleFavorite } = useGames();
  const game = games.find((item) => item.id === id);
  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/games");

  if (!game) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#111318] px-5">
        <StatusBar style="light" />
        <Ionicons name="game-controller-outline" size={48} color="#717B8D" />
        <Text className="mt-4 text-xl font-bold text-white">
          Jogo não encontrado
        </Text>
        <Text className="mt-2 text-center text-sm text-[#9CA3AF]">
          Este jogo não está disponível na sua biblioteca.
        </Text>
        <Pressable
          onPress={() => router.replace("/games")}
          accessibilityRole="button"
          className="mt-6 rounded-xl bg-blue-600 px-6 py-4"
        >
          <Text className="font-bold text-white">Voltar para meus jogos</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const rating = game.rating ?? 0;
  const tags = game.tags?.length ? game.tags : game.genre ? [game.genre] : [];
  const progress = Math.max(0, Math.min(100, game.progress ?? 0));

  return (
    <View className="flex-1 bg-[#111318]">
      <StatusBar style="light" />
      <SafeAreaView edges={["left", "right"]} className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          }}
        >
          <View
            style={{ height: 280 + insets.top }}
            className="overflow-hidden bg-[#1C2029]"
          >
            {game.cover ? (
              <Image
                source={game.cover}
                contentFit="cover"
                style={StyleSheet.absoluteFill}
                accessible={false}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons
                  name="game-controller-outline"
                  size={72}
                  color="#454E60"
                />
              </View>
            )}
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(17,19,24,0.35)", "rgba(17,19,24,0.45)", "#111318"]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View
              className="absolute left-5 right-5 flex-row items-center justify-between"
              style={{ top: insets.top + 12 }}
            >
              <Pressable
                onPress={goBack}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
                className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#111318]/80 active:opacity-80"
              >
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => toggleFavorite(game.id)}
                accessibilityRole="button"
                accessibilityLabel={
                  game.favorite
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"
                }
                accessibilityState={{ selected: !!game.favorite }}
                className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#111318]/80 active:opacity-80"
              >
                <Ionicons
                  name={game.favorite ? "heart" : "heart-outline"}
                  size={22}
                  color={game.favorite ? "#F87171" : "#FFFFFF"}
                />
              </Pressable>
            </View>
            {game.award && (
              <View className="absolute bottom-4 left-5 flex-row items-center gap-1.5 rounded-full bg-[#333539]/80 px-3 py-1.5">
                <View className="h-1.5 w-1.5 rounded-full bg-[#7BD0FF]" />
                <Text className="text-[11px] font-medium tracking-wide text-[#7BD0FF]">
                  {game.award}
                </Text>
              </View>
            )}
          </View>
          <View className="px-5">
            <Text
              accessibilityRole="header"
              className="text-[28px] font-extrabold tracking-[-0.6px] text-[#E5E7EB]"
            >
              {game.title}
            </Text>
            {(!!game.developer || !!game.publisher) && (
              <View className="mt-1 flex-row flex-wrap items-center gap-2">
                {!!game.developer && (
                  <Text className="text-[13px] font-medium text-[#C1C6D5]">
                    {game.developer}
                  </Text>
                )}
                {!!game.developer && !!game.publisher && (
                  <View className="h-1 w-1 rounded-full bg-[#414753]" />
                )}
                {!!game.publisher && (
                  <Text className="text-xs text-[#8B919F]">
                    {game.publisher}
                  </Text>
                )}
              </View>
            )}
            <View className="mt-3.5 flex-row flex-wrap gap-2">
              <View className="flex-row items-center gap-1.5 rounded-full bg-[#282A2E] px-3 py-1.5">
                <Ionicons
                  name="game-controller-outline"
                  size={14}
                  color="#ABC7FF"
                />
                <Text className="text-xs font-semibold text-[#ABC7FF]">
                  {game.platform}
                </Text>
              </View>
              {tags.map((tag) => (
                <View
                  key={tag}
                  className="rounded-full bg-[#282A2E] px-3 py-1.5"
                >
                  <Text className="text-xs font-semibold text-[#C1C6D5]">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
            <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-[#1E2024] p-3.5">
              <View className="flex-1">
                <Text className="text-[11px] font-semibold tracking-wider text-[#C1C6D5]">
                  MINHA NOTA
                </Text>
                <View
                  className="mt-1 flex-row"
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Minha nota"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => updateGame(game.id, { rating: star })}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: rating === star }}
                      accessibilityLabel={`${star} de 5 estrelas`}
                      className="min-h-11 flex-1 max-w-[40px] items-center justify-center active:opacity-70"
                    >
                      <Ionicons
                        name={star <= rating ? "star" : "star-outline"}
                        size={24}
                        color="#FFB657"
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
              <View className="ml-2 flex-row items-baseline rounded-xl bg-[#333539]/60 px-3 py-2">
                <Text className="text-[28px] font-extrabold text-[#E5E7EB]">
                  {rating || "—"}
                </Text>
                <Text className="text-xs font-semibold text-[#C1C6D5]">/5</Text>
              </View>
            </View>
            <View className="mt-4">
              <SelectField
                label="STATUS"
                value={game.status ?? "none"}
                options={STATUSES}
                onChange={(value) =>
                  setStatus(game.id, value === "none" ? undefined : value)
                }
              />
            </View>
            <View className="mt-4 rounded-2xl bg-[#1E2024] p-3.5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name="stats-chart-outline"
                    size={18}
                    color="#7BD0FF"
                  />
                  <Text className="text-sm font-semibold text-[#E5E7EB]">
                    Progresso
                  </Text>
                </View>
                <Text className="text-xl font-bold text-[#7BD0FF]">
                  {game.progress == null ? "—" : `${progress}%`}
                </Text>
              </View>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={`Progresso de ${game.title}`}
                accessibilityValue={
                  game.progress == null
                    ? { text: "Não informado" }
                    : { min: 0, max: 100, now: progress }
                }
                className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-[#333539]"
              >
                <LinearGradient
                  colors={["#448FFD", "#00A6E0", "#7BD0FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    borderRadius: 10,
                  }}
                />
              </View>
              {game.progress == null && (
                <Text className="mt-2 text-xs text-[#8B919F]">
                  Progresso não informado
                </Text>
              )}
              <View className="mt-3.5 flex-row gap-2">
                <Stat
                  icon="time-outline"
                  label="Horas jogadas"
                  value={
                    game.hoursPlayed == null
                      ? "Não informado"
                      : `${game.hoursPlayed}h`
                  }
                />
                <Stat
                  icon="trophy-outline"
                  label="Conquistas"
                  value={
                    game.achievements
                      ? `${game.achievements.unlocked}/${game.achievements.total}`
                      : "Não informado"
                  }
                />
              </View>
            </View>
            {game.achievements?.latest && (
              <View className="mt-4 flex-row items-center gap-3 rounded-xl bg-[#1A1C20] p-3">
                <View className="h-10 w-10 items-center justify-center rounded-lg bg-[#333539]">
                  <Ionicons name="medal-outline" size={24} color="#FFB657" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-[#E5E7EB]">
                    {game.achievements.latest}
                  </Text>
                  <Text className="mt-0.5 text-xs text-[#C1C6D5]">
                    Última conquista desbloqueada
                  </Text>
                </View>
              </View>
            )}
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/game/add",
                  params: { editId: game.id },
                })
              }
              accessibilityRole="button"
              className="mt-4 min-h-[52px] flex-row items-center justify-center gap-2 rounded-xl bg-[#282A2E] px-5 py-3.5 active:opacity-80"
            >
              <Ionicons name="create-outline" size={20} color="#E5E7EB" />
              <Text className="text-sm font-bold text-[#E5E7EB]">
                Editar jogo
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 flex-row items-center gap-2 rounded-xl bg-[#1A1C20] p-2">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-[#282A2E]">
        <Ionicons name={icon} size={18} color="#C1C6D5" />
      </View>
      <View className="flex-1">
        <Text className="text-[11px] text-[#C1C6D5]">{label}</Text>
        <Text className="mt-0.5 text-sm font-bold text-[#E5E7EB]">{value}</Text>
      </View>
    </View>
  );
}
