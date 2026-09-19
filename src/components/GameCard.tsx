import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import type { Game, GameStatus } from "../data/games";

type BadgeKey = GameStatus | "favorite";
type BadgeConfig = { box: string; icon: ReactNode };

const STATUS_BADGE: Record<BadgeKey, BadgeConfig> = {
  playing: {
    box: "bg-[#12233A]/90",
    icon: <Ionicons name="game-controller-outline" size={18} color="#60A5FA" />,
  },
  completed: {
    box: "bg-[#0F2A24]/90",
    icon: (
      <MaterialCommunityIcons
        name="check-decagram-outline"
        size={18}
        color="#34D399"
      />
    ),
  },
  paused: {
    box: "bg-[#2B2010]/90",
    icon: <Ionicons name="pause" size={16} color="#FBBF24" />,
  },
  favorite: {
    box: "bg-[#2B141C]/90",
    icon: <Ionicons name="heart" size={16} color="#F87171" />,
  },
};

type GameCardProps = {
  game: Game;
  width: number;
  onPress?: () => void;
  onBadgePress?: () => void;
};

export function GameCard({
  game,
  width,
  onPress,
  onBadgePress,
}: GameCardProps) {
  const badgeKey: BadgeKey | undefined =
    game.status ?? (game.favorite ? "favorite" : undefined);
  const badge = badgeKey ? STATUS_BADGE[badgeKey] : null;

  return (
    <Pressable
      onPress={onPress}
      style={{ width }}
      className="active:opacity-85"
      accessibilityRole="button"
      accessibilityLabel={`${game.title}, ${game.developer}. Abrir detalhes`}
    >
      <View
        style={{ width, aspectRatio: 3 / 4 }}
        className="overflow-hidden rounded-3xl bg-[#1C2029]"
      >
        <Image
          source={game.cover}
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
          accessible={false}
        />

        <View
          style={{
            position: "absolute",
            left: 10,
            top: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#1b1f27",
            backgroundColor: "#14171d",
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <Text className="text-[12px] font-bold text-sky-400">
            {game.platform}
          </Text>
        </View>

        {badge && (
          <Pressable
            onPress={onBadgePress}
            hitSlop={8}
            className={`absolute bottom-2.5 right-2.5 h-9 w-9 items-center justify-center rounded-full active:opacity-70 ${badge.box}`}
            accessibilityRole="button"
            accessibilityLabel={`Alterar status de ${game.title}`}
          >
            {badge.icon}
          </Pressable>
        )}
      </View>

      <Text
        numberOfLines={1}
        className="mt-3 text-base font-semibold text-white"
      >
        {game.title}
      </Text>
      <Text numberOfLines={1} className="mt-0.5 text-sm text-[#9CA3AF]">
        {game.developer}
      </Text>
    </Pressable>
  );
}

export default GameCard;
