import { Ionicons } from "@expo/vector-icons";
import { Pressable, TextInput, View } from "react-native";

type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export default function SearchBar({ value, onChangeText }: SearchBarProps) {
  return (
    <View className="h-[54px] flex-row items-center rounded-2xl border border-[#252C3C] bg-[#141822] px-4">
      <Ionicons name="search-outline" size={21} color="#9CA3AF" accessible={false} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Buscar pelo título…"
        accessibilityLabel="Buscar jogos"
        placeholderTextColor="#6B7280"
        selectionColor="#3B82F6"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="search"
        className="ml-3 flex-1 text-base text-[#E5E7EB]"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText("")}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
          hitSlop={8}
          className="ml-2 h-8 w-8 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="close-circle" size={21} color="#9CA3AF" accessible={false} />
        </Pressable>
      )}
    </View>
  );
}
