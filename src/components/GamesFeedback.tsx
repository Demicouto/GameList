import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Props = {
  loading?: boolean;
  error?: string | null;
  warning?: string | null;
  empty?: boolean;
  retry: () => void;
  onAdd?: () => void;
};
export function GamesFeedback({ loading, error, warning, empty, retry, onAdd }: Props) {
  return (
    <View className="items-center gap-4 px-5 py-8">
      {loading ? <><ActivityIndicator color="#3B82F6" /><Text className="text-base text-[#9CA3AF]">Carregando biblioteca…</Text></> : null}
      {!loading && error ? <>
        <Text accessibilityRole="alert" className="text-center text-base text-red-400">{error}</Text>
        <Pressable onPress={retry} accessibilityRole="button" className="rounded-2xl bg-blue-600 px-5 py-3">
          <Text className="font-bold text-white">Tentar novamente</Text>
        </Pressable>
      </> : null}
      {!loading && !error && empty ? <>
        <Text className="text-center text-xl font-bold text-white">Sua biblioteca está vazia</Text>
        <Text className="text-center text-base text-[#9CA3AF]">Adicione seu primeiro jogo para começar.</Text>
        {onAdd && <Pressable onPress={onAdd} accessibilityRole="button" className="rounded-2xl bg-blue-600 px-5 py-3">
          <Text className="font-bold text-white">Adicionar primeiro jogo</Text>
        </Pressable>}
      </> : null}
      {warning && <Text accessibilityRole="alert" className="text-center text-sm text-amber-400">{warning}</Text>}
    </View>
  );
}
