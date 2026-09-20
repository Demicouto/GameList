import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
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

const PLACEHOLDER = "#6B7280";
const STRENGTH_LABELS = ["", "Fraca", "Média", "Boa", "Forte"];
const STRENGTH_BAR_COLORS = [
  "",
  "bg-red-500",
  "bg-yellow-400",
  "bg-orange-500",
  "bg-green-500",
];
const STRENGTH_TEXT_COLORS = [
  "text-[#9CA3AF]",
  "text-red-500",
  "text-yellow-400",
  "text-orange-500",
  "text-green-500",
];

function getPasswordStrength(password: string) {
  if (!password) return 0;

  const checks = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  return Math.max(checks.filter(Boolean).length, 1);
}

type FieldProps = TextInputProps & {
  label: string;
  prefix?: string;
  right?: React.ReactNode;
};

function Field({ label, prefix, right, ...inputProps }: FieldProps) {
  return (
    <View className="mb-5">
      <Text className="mb-2 text-[15px] font-semibold text-[#E5E7EB]">
        {label}
      </Text>
      <View className="h-[54px] flex-row items-center rounded-2xl border border-[#252C3C] bg-[#181D28] px-4">
        {prefix ? (
          <Text className="mr-1.5 text-base text-[#6B7280]">{prefix}</Text>
        ) : null}
        <TextInput
          {...inputProps}
          placeholderTextColor={PLACEHOLDER}
          selectionColor="#2563EB"
          className="flex-1 text-base text-[#E5E7EB]"
        />
        {right}
      </View>
    </View>
  );
}

export function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(true);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = confirm.length === 0 || password === confirm;

  const canSubmit =
    name.trim() &&
    username.trim() &&
    email.trim() &&
    password.length >= 8 &&
    password === confirm &&
    accepted;

  function handleSubmit() {
    if (!canSubmit) return;
    router.replace("/login");
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
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            }}
          >
            <View className="mx-auto w-full max-w-[480px]">
              <Pressable
                onPress={() => router.back()}
                className="h-11 w-11 items-center justify-center rounded-full border border-[#252C3C] bg-[#181D28] active:opacity-80"
                accessibilityRole="button"
                accessibilityLabel="Voltar"
              >
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </Pressable>

              <Text className="mt-8 text-[32px] font-extrabold tracking-[-0.5px] text-white">
                Criar conta
              </Text>
              <Text className="mb-7 mt-2 text-base leading-6 text-[#9CA3AF]">
                Comece a catalogar seus jogos e conquistas.
              </Text>

              <Pressable
                className="mb-7 flex-row items-center rounded-3xl border border-[#212738] bg-[#141822]/80 p-4 active:opacity-85"
                accessibilityRole="button"
                accessibilityLabel="Adicionar foto de perfil"
              >
                <View className="h-[62px] w-[62px] items-center justify-center rounded-full border border-dashed border-blue-600/70 bg-blue-600/10">
                  <Ionicons name="camera-outline" size={26} color="#3B82F6" />
                  <View className="absolute -bottom-1 -right-1 h-[22px] w-[22px] items-center justify-center rounded-full bg-blue-600">
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                  </View>
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-base font-bold text-white">
                    Foto de perfil
                  </Text>
                  <Text className="mt-0.5 text-sm leading-5 text-[#9CA3AF]">
                    Personalize seu avatar de jogador (opcional).
                  </Text>
                </View>
              </Pressable>

              <Field
                label="Nome completo ou apelido"
                placeholder="Ex: Jucyara Ferreira"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />

              <Field
                label="Nome de usuário (@gamertag)"
                placeholder="susuya"
                prefix="@"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />

              <Field
                label="E-mail"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />

              <View className="mb-5">
                <Field
                  label="Senha"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
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
                        color="#9CA3AF"
                      />
                    </Pressable>
                  }
                />

                <View className="-mt-3 flex-row items-center">
                  <View className="mr-3 flex-1 flex-row gap-2">
                    {[1, 2, 3, 4].map((step) => (
                      <View
                        key={step}
                        className={`h-1 flex-1 rounded-full ${
                          step <= strength
                            ? STRENGTH_BAR_COLORS[strength]
                            : "bg-[#252C3C]"
                        }`}
                      />
                    ))}
                  </View>
                  <Text
                    className={`w-12 text-right text-[13px] ${STRENGTH_TEXT_COLORS[strength]}`}
                  >
                    {STRENGTH_LABELS[strength]}
                  </Text>
                </View>
              </View>

              <Field
                label="Confirmar senha"
                placeholder="Digite a senha novamente"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                right={
                  <Pressable
                    onPress={() => setShowConfirm((v) => !v)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirm ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    <Ionicons
                      name={showConfirm ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#9CA3AF"
                    />
                  </Pressable>
                }
              />
              {!passwordsMatch && (
                <Text className="-mt-3 mb-4 text-[13px] text-red-400">
                  As senhas não coincidem.
                </Text>
              )}

              <Pressable
                onPress={() => setAccepted((v) => !v)}
                className="mb-7 mt-1 flex-row items-start"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: accepted }}
              >
                <View
                  className={`mr-3 mt-0.5 h-[26px] w-[26px] items-center justify-center rounded-md ${
                    accepted ? "bg-blue-600" : "border border-[#252C3C]"
                  }`}
                >
                  {accepted && (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  )}
                </View>
                <Text className="flex-1 text-[15px] leading-6 text-[#9CA3AF]">
                  Concordo com os{" "}
                  <Text className="text-white underline">
                    Termos de Serviço
                  </Text>{" "}
                  e com a{" "}
                  <Text className="text-white underline">
                    Política de Privacidade
                  </Text>
                  .
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                className={`h-[54px] w-full items-center justify-center rounded-full bg-blue-600 active:opacity-85 ${
                  canSubmit ? "" : "opacity-50"
                }`}
                accessibilityRole="button"
                accessibilityLabel="Criar minha conta"
              >
                <Text className="text-base font-bold text-white">
                  Criar minha conta
                </Text>
              </Pressable>

              <View className="mt-6 flex-row items-center justify-center">
                <Text className="text-[15px] text-[#9CA3AF]">
                  Já tem uma conta?{" "}
                </Text>
                <Pressable
                  onPress={() => router.replace("/login")}
                  hitSlop={8}
                  accessibilityRole="link"
                >
                  <Text className="text-[15px] font-bold text-blue-500">
                    Entrar
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

export default RegisterScreen;
