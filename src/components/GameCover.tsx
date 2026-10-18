import { Ionicons } from "@expo/vector-icons";
import { Image, type ImageSource } from "expo-image";
import { useState } from "react";
import { View } from "react-native";

export function GameCover({ cover, coverUrl, iconSize = 44 }: { cover?: ImageSource; coverUrl?: string | null; iconSize?: number }) {
  const key = `${JSON.stringify(cover)}:${coverUrl ?? ""}`;
  const [failure, setFailure] = useState({ key: "", stage: 0 });
  const stage = failure.key === key ? failure.stage : 0;
  const source = stage === 0 ? cover ?? (coverUrl ? { uri: coverUrl } : undefined)
    : stage === 1 && coverUrl && cover?.uri !== coverUrl ? { uri: coverUrl } : undefined;
  return <View className="flex-1 items-center justify-center">
    {source ? <Image source={source} contentFit="cover" style={{ width: "100%", height: "100%" }} accessible={false}
      onError={() => setFailure({ key, stage: stage + 1 })} />
      : <Ionicons name="game-controller-outline" size={iconSize} color="#454E60" accessible={false} />}
  </View>;
}
