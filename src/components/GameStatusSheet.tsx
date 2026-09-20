import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGames } from "../context/GamesContext";
import type { GameStatus } from "../data/games";

type Option = {
  key: GameStatus | undefined;
  label: string;
  icon: ReactNode;
};

const OPTIONS: Option[] = [
  {
    key: "wishlist",
    label: "Quero jogar",
    icon: <Ionicons name="bookmark-outline" size={20} color="#C4B5FD" />,
  },
  {
    key: "playing",
    label: "Jogando",
    icon: <Ionicons name="game-controller-outline" size={20} color="#60A5FA" />,
  },
  {
    key: "completed",
    label: "Concluído",
    icon: (
      <MaterialCommunityIcons
        name="check-decagram-outline"
        size={20}
        color="#34D399"
      />
    ),
  },
  {
    key: "paused",
    label: "Pausado",
    icon: <Ionicons name="pause-circle-outline" size={20} color="#FBBF24" />,
  },
  {
    key: undefined,
    label: "Sem status",
    icon: <Ionicons name="remove-circle-outline" size={20} color="#9CA3AF" />,
  },
];

type GameStatusSheetProps = {
  gameId: string | null;
  onClose: () => void;
};

export function GameStatusSheet({ gameId, onClose }: GameStatusSheetProps) {
  const insets = useSafeAreaInsets();
  const { games, setStatus, toggleFavorite } = useGames();
  const game = games.find((g) => g.id === gameId);

  return (
    <Modal
      visible={!!game}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute bottom-0 left-0 right-0 top-0 bg-black/60"
          onPress={onClose}
          accessibilityLabel="Fechar"
        />

        {game && (
          <View
            className="rounded-t-[28px] border-t border-[#252C3C] bg-[#171A22] px-5 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
          >
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-[#252C3C]" />

            <Text className="text-xl font-bold text-[#E5E7EB]">
              {game.title}
            </Text>
            <Text className="mb-4 mt-0.5 text-sm text-[#9CA3AF]">
              Escolha o status do jogo
            </Text>

            {OPTIONS.map((option) => {
              const selected = game.status === option.key;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => setStatus(game.id, option.key)}
                  className={`mb-2 h-[52px] flex-row items-center rounded-2xl border px-4 active:opacity-80 ${
                    selected
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-[#252C3C] bg-[#181D28]"
                  }`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  {option.icon}
                  <Text className="ml-3 flex-1 text-base font-medium text-[#E5E7EB]">
                    {option.label}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => toggleFavorite(game.id)}
              className="mt-1 h-[52px] flex-row items-center rounded-2xl border border-[#252C3C] bg-[#181D28] px-4 active:opacity-80"
              accessibilityRole="button"
              accessibilityState={{ selected: !!game.favorite }}
            >
              <Ionicons
                name={game.favorite ? "heart" : "heart-outline"}
                size={20}
                color="#F87171"
              />
              <Text className="ml-3 flex-1 text-base font-medium text-[#E5E7EB]">
                {game.favorite
                  ? "Remover dos favoritos"
                  : "Adicionar aos favoritos"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              className="mt-4 h-[52px] items-center justify-center rounded-full bg-blue-600 active:opacity-85"
              accessibilityRole="button"
            >
              <Text className="text-base font-bold text-white">Pronto</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

export default GameStatusSheet;
