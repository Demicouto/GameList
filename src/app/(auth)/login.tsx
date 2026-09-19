import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

const PLACEHOLDER = "#6B7280";
const ICON = "#9CA3AF";

type FieldProps = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
};

function Field({ icon, right, ...inputProps }: FieldProps) {
  return (
    <View className="h-[54px] flex-row items-center rounded-2xl border border-[#252C3C] bg-[#141822] px-4">
      <Ionicons name={icon} size={22} color={ICON} />
      <TextInput
        {...inputProps}
        placeholderTextColor={PLACEHOLDER}
        selectionColor="#2563EB"
        className="ml-3 flex-1 text-base text-[#E5E7EB]"
      />
      {right}
    </View>
  );
}

function GoogleIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

function SteamIcon({
  size = 22,
  color = "#2A75BB",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="11.5" fill="#FFFFFF" />
      <Path
        fill={color}
        d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"
      />
    </Svg>
  );
}

const SOCIALS = [
  { key: "google", label: "Google" },
  { key: "steam", label: "Steam" },
  { key: "xbox", label: "Xbox" },
] as const;

function SocialIcon({ name }: { name: (typeof SOCIALS)[number]["key"] }) {
  if (name === "google") return <GoogleIcon />;
  if (name === "steam") return <SteamIcon color="#2b4d77" />;
  return <Ionicons name="logo-xbox" size={22} color="#16A34A" />;
}

export function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = login.trim().length > 0 && password.length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    router.replace("/home");
  }

  return (
    <View className="flex-1 bg-[#0A0D14]">
      <StatusBar style="light" />

      <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            }}
          >
            <View className="mx-auto w-full max-w-[480px] flex-1 justify-between">
              <View>
                <Pressable
                  onPress={() => router.back()}
                  className="h-11 w-11 items-center justify-center rounded-full border border-[#252C3C] bg-[#181D28] active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel="Voltar"
                >
                  <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                </Pressable>

                <Text className="mt-8 text-[32px] font-extrabold tracking-[-0.5px] text-white">
                  Entrar
                </Text>
                <Text className="mb-8 mt-2 text-base leading-6 text-[#9CA3AF]">
                  Acesse sua conta para continuar sua jornada gamer.
                </Text>

                <Text className="mb-2 text-[13px] font-medium uppercase tracking-[0.6px] text-[#E5E7EB]">
                  E-mail ou nome de usuário
                </Text>
                <Field
                  icon="person-outline"
                  placeholder="ex: seuemail@exemplo.com"
                  value={login}
                  onChangeText={setLogin}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                />

                <View className="mb-2 mt-5 flex-row items-center justify-between">
                  <Text className="text-[13px] font-medium uppercase tracking-[0.6px] text-[#E5E7EB]">
                    Senha
                  </Text>
                  <Pressable hitSlop={8} accessibilityRole="link">
                    <Text className="text-sm font-medium text-blue-400">
                      Esqueceu a senha?
                    </Text>
                  </Pressable>
                </View>
                <Field
                  icon="lock-closed-outline"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  right={
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={ICON}
                      />
                    </Pressable>
                  }
                />

                <Pressable
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  className={`mt-6 h-[54px] w-full flex-row items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/40 active:opacity-85 ${
                    canSubmit ? "" : "opacity-50"
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel="Entrar na conta"
                >
                  <Text className="mr-2 text-base font-bold text-white">
                    Entrar na conta
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </Pressable>

                <View className="my-7 flex-row items-center">
                  <View className="h-px flex-1 bg-[#212738]" />
                  <Text className="mx-3 text-[13px] font-medium uppercase tracking-[0.6px] text-[#6B7280]">
                    Ou continue com
                  </Text>
                  <View className="h-px flex-1 bg-[#212738]" />
                </View>

                <View className="flex-row gap-3">
                  {SOCIALS.map((s) => (
                    <Pressable
                      key={s.key}
                      className="h-12 flex-1 items-center justify-center rounded-2xl border border-[#212738] bg-[#141822] active:opacity-80"
                      accessibilityRole="button"
                      accessibilityLabel={`Continuar com ${s.label}`}
                    >
                      <SocialIcon name={s.key} />
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="mt-10 flex-row items-center justify-center">
                <Text className="text-[15px] text-[#9CA3AF]">
                  Não tem uma conta?{" "}
                </Text>
                <Pressable
                  onPress={() => router.replace("/register")}
                  hitSlop={8}
                  accessibilityRole="link"
                >
                  <Text className="text-[15px] font-bold text-blue-400">
                    Cadastre-se
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export default LoginScreen;
