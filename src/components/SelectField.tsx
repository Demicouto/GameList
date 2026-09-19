import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type SelectOption<T extends string> = { value: T; label: string };

type SelectFieldProps<T extends string> = {
  label: string;
  value: T | "";
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  error?: string;
};

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((option) => option.value === value);

  return (
    <View className="gap-1.5">
      <Text className="text-xs text-[#ADB7C8]">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? "Selecione"}`}
        accessibilityState={{ expanded: open }}
        className={`min-h-[50px] flex-row items-center rounded-xl border bg-[#131824] px-3.5 py-3 active:opacity-80 ${error ? "border-red-400" : "border-[#1E2536]"}`}
      >
        <Text
          className={`flex-1 text-sm ${selected ? "text-white" : "text-[#717B8D]"}`}
        >
          {selected?.label ?? "Selecione"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#717B8D" />
      </Pressable>
      {error && (
        <Text accessibilityLiveRegion="polite" className="text-xs text-red-400">
          {error}
        </Text>
      )}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="absolute bottom-0 left-0 right-0 top-0 bg-black/60"
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar opções"
          />
          <View
            accessibilityViewIsModal
            className="max-h-[80%] rounded-t-[28px] border-t border-[#252C3C] bg-[#171A22] px-5 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
          >
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-[#252C3C]" />
            <View className="mb-4 flex-row items-center justify-between">
              <Text
                accessibilityRole="header"
                className="text-xl font-bold text-[#E5E7EB]"
              >
                {label}
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                className="h-11 w-11 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Fechar opções"
              >
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: value === option.value }}
                  className={`mb-2 min-h-[52px] flex-row items-center rounded-2xl border px-4 py-3 active:opacity-80 ${value === option.value ? "border-blue-500 bg-blue-500/10" : "border-[#252C3C] bg-[#181D28]"}`}
                >
                  <Text className="flex-1 text-base text-[#E5E7EB]">
                    {option.label}
                  </Text>
                  {value === option.value && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
