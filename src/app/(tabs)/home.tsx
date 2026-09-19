import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { GameCard } from "../../components/GameCard";
import { GameStatusSheet } from "../../components/GameStatusSheet";
import { useGames } from "../../context/GamesContext";
import type { StatKey } from "../../context/GamesContext";
import { ACHIEVEMENTS, FEATURED } from "../../data/games";

const TABS = ["Resumo", "Atividade", "Amigos"];

type StatCard = {
  key: StatKey;
  label: string;
  box: string;
  icon: ReactNode;
};

const STAT_CARDS: StatCard[] = [
  {
    key: "playing",
    label: "Jogando",
    box: "bg-[#12233A]",
    icon: <Ionicons name="game-controller-outline" size={22} color="#60A5FA" />,
  },
  {
    key: "completed",
    label: "Concluídos",
    box: "bg-[#0F2A24]",
    icon: (
      <MaterialCommunityIcons
        name="check-decagram-outline"
        size={22}
        color="#34D399"
      />
    ),
  },
  {
    key: "paused",
    label: "Pausados",
    box: "bg-[#2B2010]",
    icon: <Ionicons name="pause-circle-outline" size={22} color="#FBBF24" />,
  },
  {
    key: "favorites",
    label: "Favoritos",
    box: "bg-[#2B141C]",
    icon: <Ionicons name="heart" size={20} color="#F87171" />,
  },
];

type NavItemProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress?: () => void;
};

function NavItem({ label, icon, active, onPress }: NavItemProps) {
  const color = active ? "#3B82F6" : "#9CA3AF";
  return (
    <Pressable
      onPress={onPress}
      className="items-center active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={24} color={color} />
      <Text className="mt-1 text-[12px] font-medium" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

function BottomNav({ bottomInset }: { bottomInset: number }) {
  const router = useRouter();
  return (
    <View
      className="absolute bottom-0 left-0 right-0 flex-row items-center justify-around border-t border-white/5 bg-[#161A22] px-2 pt-3"
      style={{ paddingBottom: Math.max(bottomInset, 12) }}
    >
      <NavItem label="Início" icon="home" active />
      <NavItem label="Biblioteca" icon="library-outline" />

      <Pressable
        onPress={() => router.push("/game/add")}
        className="-mt-8 h-14 w-14 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 active:opacity-85"
        accessibilityRole="button"
        accessibilityLabel="Adicionar jogo"
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Pressable>

      <NavItem label="Descobrir" icon="compass-outline" />
      <NavItem label="Perfil" icon="person-circle-outline" />
    </View>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("Resumo");

  const { games, stats } = useGames();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <View className="flex-1 bg-[#111318]">
      <StatusBar style="light" />

      <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        >
          <View className="flex-row items-start justify-between px-5 pt-4">
            <View>
              <Text className="text-[32px] font-extrabold tracking-[-0.5px] text-[#E5E7EB]">
                Olá, Demétrio
              </Text>
              <Text className="mt-0.5 text-base text-[#9CA3AF]">
                Pronto para jogar hoje?
              </Text>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                className="h-11 w-11 items-center justify-center rounded-full border border-[#252C3C] bg-[#181D28] active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel="Notificações"
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="#E5E7EB"
                />
              </Pressable>
              <Pressable
                className="h-11 w-11 items-center justify-center rounded-full border-2 border-[#243149] bg-[#181D28] active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel="Configurações"
              >
                <Ionicons name="settings-outline" size={20} color="#E5E7EB" />
              </Pressable>
            </View>
          </View>

          <View className="mt-5 flex-row gap-3 px-5">
            {TABS.map((t) => {
              const active = t === tab;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  className={`h-11 items-center justify-center rounded-full px-6 ${
                    active ? "bg-blue-500" : "bg-[#1C2029]"
                  }`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    className={`text-base font-semibold ${
                      active ? "text-white" : "text-[#9CA3AF]"
                    }`}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mx-5 mt-5 h-[208px] overflow-hidden rounded-[28px] bg-[#1C2029]">
            <Image
              source={FEATURED.banner}
              contentFit="cover"
              style={StyleSheet.absoluteFill}
              accessible={false}
            />
            <LinearGradient
              pointerEvents="none"
              colors={["transparent", "rgba(17, 19, 24, 0.9)"]}
              locations={[0.25, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View className="absolute bottom-4 left-5 right-5 flex-row items-end justify-between">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center">
                  <View className="mr-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <Text className="text-[13px] font-medium uppercase tracking-[0.6px] text-sky-400">
                    Continue jogando
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  className="mt-1 text-[26px] font-extrabold tracking-[-0.5px] text-white"
                >
                  {FEATURED.title}
                </Text>
                <View className="mt-2 flex-row items-center">
                  <View className="mr-3 rounded-lg bg-white/10 px-2.5 py-1">
                    <Text className="text-[13px] font-semibold text-[#D1D5DB]">
                      {FEATURED.platform}
                    </Text>
                  </View>
                  <Text className="text-[15px] text-[#D1D5DB]">
                    {FEATURED.chapter} • {FEATURED.progress}%
                  </Text>
                </View>
              </View>

              <Pressable
                className="h-14 w-14 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 active:opacity-85"
                accessibilityRole="button"
                accessibilityLabel={`Continuar ${FEATURED.title}`}
              >
                <Ionicons name="play" size={24} color="#111318" />
              </Pressable>
            </View>
          </View>

          <View className="mt-5 flex-row gap-2.5 px-5">
            {STAT_CARDS.map((s) => (
              <View
                key={s.key}
                className="flex-1 items-center rounded-2xl bg-[#171A22] px-1 py-4"
              >
                <View
                  className={`h-10 w-10 items-center justify-center rounded-xl ${s.box}`}
                >
                  {s.icon}
                </View>
                <Text className="mt-2 text-[30px] font-extrabold text-[#E5E7EB]">
                  {stats[s.key]}
                </Text>
                <Text className="text-[13px] text-[#9CA3AF]">{s.label}</Text>
              </View>
            ))}
          </View>

          <View className="mt-7 flex-row items-center justify-between px-5">
            <Text className="text-xl font-bold text-[#E5E7EB]">Meus jogos</Text>
            <Pressable
              onPress={() => router.push("/games")}
              hitSlop={8}
              className="flex-row items-center"
              accessibilityRole="link"
            >
              <Text className="text-base font-semibold text-sky-400">
                Ver todos
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#38BDF8" />
            </Pressable>
          </View>

          <FlatList
            horizontal
            data={games}
            keyExtractor={(g) => g.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14 }}
            ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
            renderItem={({ item }) => (
              <GameCard
                game={item}
                width={128}
                onPress={() =>
                  router.push({
                    pathname: "/game/[id]",
                    params: { id: item.id },
                  })
                }
                onBadgePress={() => setSelectedId(item.id)}
              />
            )}
          />

          <View className="mt-8 flex-row items-center justify-between px-5">
            <Text className="text-xl font-bold text-[#E5E7EB]">
              Atividade recente
            </Text>
            <Text className="text-[15px] text-[#9CA3AF]">Hoje</Text>
          </View>

          <View className="mt-3.5 gap-3 px-5">
            {ACHIEVEMENTS.slice(0, 3).map((a) => (
              <View
                key={a.id}
                className="flex-row items-center rounded-3xl bg-[#171A22] p-4"
              >
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#1F1D18]">
                  <Ionicons name="medal" size={24} color="#F59E0B" />
                </View>

                <View className="ml-4 flex-1">
                  <Text className="text-sm font-medium text-amber-500">
                    Conquista desbloqueada
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 text-lg font-bold text-[#E5E7EB]"
                  >
                    {a.title}
                  </Text>
                  <Text numberOfLines={1} className="text-sm text-[#9CA3AF]">
                    {a.game} • {a.time}
                  </Text>
                </View>

                <Text className="ml-2 text-base font-bold text-sky-400">
                  +{a.xp} XP
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomNav bottomInset={insets.bottom} />

      <GameStatusSheet
        gameId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </View>
  );
}

export default HomeScreen;
