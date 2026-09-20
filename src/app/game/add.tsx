import { Ionicons } from "@expo/vector-icons";
import { Image, type ImageSource } from "expo-image";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SelectField, type SelectOption } from "../../components/SelectField";
import { useGames } from "../../context/GamesContext";
import type { GamePlatform, GameStatus } from "../../data/games";

const PLATFORMS: SelectOption<GamePlatform>[] = [
  { value: "PS5", label: "PlayStation 5" },
  { value: "PS4", label: "PlayStation 4" },
  { value: "Xbox Series X|S", label: "Xbox Series X|S" },
  { value: "Xbox One", label: "Xbox One" },
  { value: "Switch", label: "Nintendo Switch" },
  { value: "PC", label: "PC" },
  { value: "Mobile", label: "Mobile" },
];
const COVER_MIME_TYPES = [
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const COVER_EXTENSION = /\.(svg|png|jpe?g|webp)$/i;
const GENRES = [
  "Ação",
  "Aventura",
  "RPG",
  "Estratégia",
  "Esporte",
  "Corrida",
  "Terror",
  "Puzzle",
].map((genre) => ({ value: genre, label: genre }));
const STATUSES: SelectOption<GameStatus | "none">[] = [
  { value: "none", label: "Sem status" },
  { value: "wishlist", label: "Quero jogar" },
  { value: "playing", label: "Jogando" },
  { value: "paused", label: "Pausado" },
  { value: "completed", label: "Concluído" },
];

export default function AddGameScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const insets = useSafeAreaInsets();
  const { games, addGame, updateGame } = useGames();
  const existingGame = games.find((game) => game.id === editId);
  const [name, setName] = useState(existingGame?.title ?? "");
  const [platform, setPlatform] = useState<GamePlatform | "">(
    existingGame?.platform ?? "",
  );
  const [genre, setGenre] = useState(existingGame?.genre ?? "");
  const [status, setStatus] = useState<GameStatus | "none">(
    existingGame ? (existingGame.status ?? "none") : "wishlist",
  );
  const [cover, setCover] = useState<ImageSource | undefined>(
    existingGame?.cover,
  );
  const [coverMenu, setCoverMenu] = useState(false);
  const [coverError, setCoverError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const saving = useRef(false);
  const nameInput = useRef<TextInput>(null);

  function selectCover(
    uri: string,
    fileName?: string | null,
    mimeType?: string | null,
  ) {
    const name = fileName || uri.split(/[?#]/)[0];
    const mime = mimeType?.split(";")[0].trim().toLowerCase();
    const hasExtension = /\.[a-z0-9]+$/i.test(name);
    const knownMime = !!mime && mime !== "application/octet-stream";
    if (
      (hasExtension && !COVER_EXTENSION.test(name)) ||
      (knownMime && !COVER_MIME_TYPES.includes(mime)) ||
      (!COVER_EXTENSION.test(name) && !knownMime)
    ) {
      setCoverError(
        "Formato não permitido. Escolha uma capa SVG, PNG, JPEG ou WebP.",
      );
      return;
    }
    setCover({ uri });
  }

  async function pickCoverFile() {
    setCoverMenu(false);
    setCoverError("");
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: COVER_MIME_TYPES,
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        selectCover(asset.uri, asset.name, asset.mimeType);
      }
    } catch {
      setCoverError("Não foi possível abrir o arquivo. Tente novamente.");
    }
  }

  async function pickCover() {
    setCoverMenu(false);
    setCoverError("");
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        quality: 1,
      };
      const result = await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        selectCover(asset.uri, asset.fileName, asset.mimeType);
      }
    } catch {
      setCoverError(
        "Não foi possível abrir a imagem. Tente novamente ou escolha outra capa.",
      );
    }
  }

  function handleSubmit() {
    setSubmitted(true);
    if (!name.trim()) {
      nameInput.current?.focus();
      return;
    }
    if (!platform || (!genre && !existingGame) || saving.current) return;
    if (editId && !existingGame) {
      setCoverError("Este jogo não está mais disponível para edição.");
      return;
    }
    saving.current = true;
    if (existingGame) {
      updateGame(existingGame.id, {
        title: name.trim(),
        platform,
        genre: genre || undefined,
        tags: genre !== existingGame.genre ? undefined : existingGame.tags,
        status: status === "none" ? undefined : status,
        cover,
      });
      if (router.canGoBack()) router.back();
      else
        router.replace({
          pathname: "/game/[id]",
          params: { id: existingGame.id },
        });
      return;
    }
    addGame({
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: name.trim(),
      developer: "",
      platform,
      genre,
      status: status === "none" ? undefined : status,
      cover,
    });
    router.replace("/games");
  }

  return (
    <View className="flex-1 bg-[#0A0D14]">
      <StatusBar style="light" />
      <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            }}
          >
            <Pressable
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/home")
              }
              className="h-11 w-11 items-center justify-center rounded-full border border-[#252C3C] bg-[#181D28] active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Text
              accessibilityRole="header"
              className="mt-4 text-[26px] font-extrabold tracking-[-0.5px] text-[#E5E7EB]"
            >
              {existingGame ? "Editar jogo" : "Adicionar jogo"}
            </Text>
            <Text className="mt-1 text-sm text-[#9CA3AF]">
              {existingGame
                ? "Atualize as informações do seu jogo."
                : "Registre um novo jogo na sua biblioteca."}
            </Text>

            <Pressable
              onPress={() => setCoverMenu(true)}
              accessibilityRole="button"
              accessibilityLabel={
                cover ? "Alterar capa do jogo" : "Adicionar capa do jogo"
              }
              className="mb-4 mt-6 min-h-[112px] flex-row items-center justify-center gap-4 rounded-2xl border border-dashed border-[#252C3C] bg-[#131824] p-4 active:opacity-80"
            >
              {cover && (
                <Image
                  source={cover}
                  contentFit="cover"
                  style={{ width: 60, height: 80, borderRadius: 8 }}
                  accessible={false}
                />
              )}
              <View className="shrink items-center">
                {!cover && (
                  <Ionicons
                    name="image-outline"
                    size={30}
                    color="#717B8D"
                    style={{ marginBottom: 8 }}
                  />
                )}
                <Text className="text-[13px] font-bold text-[#E1E7F5]">
                  {cover ? "Alterar capa" : "Adicionar capa"}
                </Text>
                <Text className="mt-0.5 text-center text-[11px] text-[#717B8D]">
                  {cover
                    ? "Toque para escolher outra imagem"
                    : "SVG, PNG, JPEG ou WebP"}
                </Text>
              </View>
            </Pressable>
            {!!coverError && (
              <Text
                accessibilityLiveRegion="polite"
                className="mb-4 text-xs text-red-400"
              >
                {coverError}
              </Text>
            )}

            <View className="gap-3.5">
              <View className="gap-1.5">
                <Text
                  nativeID="game-name-label"
                  className="text-xs text-[#ADB7C8]"
                >
                  Nome do jogo
                </Text>
                <TextInput
                  ref={nameInput}
                  value={name}
                  onChangeText={setName}
                  accessibilityLabel="Nome do jogo"
                  accessibilityLabelledBy="game-name-label"
                  placeholder="Digite o nome..."
                  placeholderTextColor="#454E60"
                  selectionColor="#3B82F6"
                  maxLength={120}
                  returnKeyType="done"
                  className={`min-h-[50px] rounded-xl border bg-[#131824] px-3.5 py-3.5 text-sm text-white ${submitted && !name.trim() ? "border-red-400" : "border-[#1E2536]"}`}
                />
                {submitted && !name.trim() && (
                  <Text
                    accessibilityLiveRegion="polite"
                    className="text-xs text-red-400"
                  >
                    Digite o nome do jogo.
                  </Text>
                )}
              </View>
              <SelectField
                label="Plataforma"
                value={platform}
                options={PLATFORMS}
                onChange={setPlatform}
                error={
                  submitted && !platform ? "Selecione a plataforma." : undefined
                }
              />
              <SelectField
                label="Gênero"
                value={genre}
                options={GENRES}
                onChange={setGenre}
                error={
                  submitted && !genre && !existingGame
                    ? "Selecione o gênero."
                    : undefined
                }
              />
              <SelectField
                label="Status"
                value={status}
                options={STATUSES}
                onChange={setStatus}
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              accessibilityRole="button"
              className="mt-7 min-h-[52px] items-center justify-center rounded-xl bg-blue-600 px-4 py-3.5 active:opacity-85"
            >
              <Text className="text-sm font-bold text-white">
                {existingGame ? "Salvar alterações" : "Adicionar à biblioteca"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={coverMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setCoverMenu(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            onPress={() => setCoverMenu(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar opções de capa"
            className="absolute bottom-0 left-0 right-0 top-0 bg-black/60"
          />
          <View
            accessibilityViewIsModal
            className="rounded-t-[28px] border-t border-[#252C3C] bg-[#171A22] px-5 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
          >
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-[#252C3C]" />
            <Text
              accessibilityRole="header"
              className="mb-4 text-xl font-bold text-[#E5E7EB]"
            >
              Capa do jogo
            </Text>
            <Pressable
              onPress={() => void pickCover()}
              accessibilityRole="button"
              className="min-h-[52px] flex-row items-center gap-3 rounded-2xl border border-[#252C3C] bg-[#181D28] px-4 py-3 active:opacity-80"
            >
              <Ionicons name="images-outline" size={22} color="#60A5FA" />
              <Text className="text-base text-[#E5E7EB]">
                Escolher da galeria
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void pickCoverFile()}
              accessibilityRole="button"
              className="mt-2 min-h-[52px] flex-row items-center gap-3 rounded-2xl border border-[#252C3C] bg-[#181D28] px-4 py-3 active:opacity-80"
            >
              <Ionicons name="document-outline" size={22} color="#60A5FA" />
              <Text className="text-base text-[#E5E7EB]">Escolher arquivo</Text>
            </Pressable>
            {cover && (
              <Pressable
                onPress={() => {
                  setCover(undefined);
                  setCoverMenu(false);
                }}
                accessibilityRole="button"
                className="mt-2 min-h-[48px] items-center justify-center"
              >
                <Text className="text-sm text-red-400">Remover capa</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setCoverMenu(false)}
              accessibilityRole="button"
              className="mt-4 min-h-[52px] items-center justify-center rounded-full bg-blue-600"
            >
              <Text className="text-base font-bold text-white">Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
