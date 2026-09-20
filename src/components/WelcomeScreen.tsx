import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const HERO_IMAGE = require("../../assets/welcomepage.svg");

type WelcomeScreenProps = {
  onLoginPress?: () => void;
  onRegisterPress?: () => void;
  onGuestPress?: () => void;
};

export function WelcomeScreen({
  onLoginPress,
  onRegisterPress,
  onGuestPress,
}: WelcomeScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#0B0F17]">
      <StatusBar style="light" />

      <View className="flex-1">
        <Image
          source={HERO_IMAGE}
          contentFit="cover"
          contentPosition="center"
          style={styles.backgroundImage}
          accessible={false}
        />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(11, 15, 23, 0.58)", "transparent"]}
          style={styles.topGradient}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[
            "transparent",
            "rgba(11, 15, 23, 0.68)",
            "rgba(11, 15, 23, 0.96)",
            "#0B0F17",
          ]}
          locations={[0, 0.4, 0.76, 1]}
          style={styles.bottomGradient}
        />

        <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
          <View className="mx-auto flex-1 w-full max-w-[480px] justify-between px-6 pt-4 android:pt-8 md:px-12">
            <View>
              <View className="mb-2">
                <Text className="text-[46px] font-black uppercase leading-[44px] tracking-[-1px] text-white md:text-[56px] md:leading-[54px]">
                  GAME
                </Text>
                <Text className="text-[46px] font-black uppercase leading-[44px] tracking-[-1px] text-white md:text-[56px] md:leading-[54px]">
                  LIST
                </Text>
              </View>

              <Text className="mt-1.5 text-[15px] font-medium leading-[22px] text-sky-400 md:text-lg">
                Sua história nos jogos,{`\n`}sempre com você.
              </Text>
            </View>

            <View
              className="w-full gap-3"
              style={{ paddingBottom: Math.max(insets.bottom, 16) + 50 }}
            >
              <Pressable
                onPress={onLoginPress ?? (() => router.push("/login"))}
                className="h-[54px] w-full items-center justify-center rounded-full bg-slate-50 shadow-lg active:opacity-85"
                accessibilityRole="button"
                accessibilityLabel="Entrar na sua conta"
              >
                <Text className="text-base font-bold tracking-[-0.2px] text-slate-900">
                  Entrar
                </Text>
              </Pressable>

              <Pressable
                onPress={onRegisterPress ?? (() => router.push("/register"))}
                className="h-[54px] w-full items-center justify-center rounded-full border border-white/10 bg-[#181C26]/95 active:opacity-85"
                accessibilityRole="button"
                accessibilityLabel="Criar uma nova conta"
              >
                <Text className="text-base font-semibold tracking-[-0.2px] text-white">
                  Criar conta
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  safeArea: {
    flex: 1,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: "28%",
  },
  bottomGradient: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: "68%",
  },
});

export default WelcomeScreen;
