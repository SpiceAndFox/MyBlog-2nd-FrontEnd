import { ref } from "vue";
import {
  createChatPreset,
  deleteChatPreset,
  getChatMeta,
  listChatPresets,
  updateChatPreset,
  uploadChatPresetAvatar,
} from "@/api/chat";
import { isPlainObject } from "./helpers";
import { mapMetaDefaults, mapPreset, mapProvider } from "./mappers";
import { loadPersistedSettings, persistSettings } from "./settingsStorage";

export function useChatSettings({ handleApiError }) {
  const providers = ref([]);
  const promptPresets = ref([]);
  const chatDefaults = ref({});

  const initialSettingsRaw = loadPersistedSettings();
  const settings = ref(isPlainObject(initialSettingsRaw) ? initialSettingsRaw : {});

  function persistCurrentSettings() {
    persistSettings(settings.value);
  }

  function normalizeSettings({ forceSystemPrompt = false } = {}) {
    const base = isPlainObject(settings.value) ? settings.value : {};
    const defaults = isPlainObject(chatDefaults.value) ? chatDefaults.value : {};

    const normalized = { ...defaults, ...base };

    const providerList = Array.isArray(providers.value) ? providers.value : [];
    const desiredProviderId = String(normalized.providerId || "").trim();
    const defaultProviderId = String(defaults.providerId || "").trim();

    const provider =
      providerList.find((p) => p.id === desiredProviderId) ||
      providerList.find((p) => p.id === defaultProviderId) ||
      providerList[0] ||
      null;

    if (provider?.id) normalized.providerId = provider.id;

    const models = provider?.models || [];
    const desiredModelId = String(normalized.modelId || "").trim();
    const defaultModelId = String(defaults.modelId || "").trim();

    const model =
      models.find((m) => m.id === desiredModelId) ||
      (provider?.id && provider.id === defaultProviderId ? models.find((m) => m.id === defaultModelId) : null) ||
      models[0] ||
      null;

    if (model?.id) normalized.modelId = model.id;

    const temperature = Number(normalized.temperature);
    normalized.temperature = Number.isFinite(temperature) ? temperature : defaults.temperature;

    const topP = Number(normalized.topP);
    normalized.topP = Number.isFinite(topP) ? topP : defaults.topP;

    const maxOutputTokens = Number(normalized.maxOutputTokens);
    normalized.maxOutputTokens = Number.isFinite(maxOutputTokens) ? maxOutputTokens : defaults.maxOutputTokens;

    const presencePenalty = Number(normalized.presencePenalty);
    normalized.presencePenalty = Number.isFinite(presencePenalty) ? presencePenalty : defaults.presencePenalty;

    const frequencyPenalty = Number(normalized.frequencyPenalty);
    normalized.frequencyPenalty = Number.isFinite(frequencyPenalty) ? frequencyPenalty : defaults.frequencyPenalty;

    normalized.stream = typeof normalized.stream === "boolean" ? normalized.stream : defaults.stream;
    normalized.enableWebSearch =
      typeof normalized.enableWebSearch === "boolean" ? normalized.enableWebSearch : defaults.enableWebSearch;

    const presetList = Array.isArray(promptPresets.value) ? promptPresets.value : [];
    const desiredPresetId = String(normalized.systemPromptPresetId || "").trim();
    const defaultPresetId = String(defaults.systemPromptPresetId || "").trim();

    const preset =
      presetList.find((p) => p.id === desiredPresetId) ||
      presetList.find((p) => p.id === defaultPresetId) ||
      presetList.find((p) => p.id === "default") ||
      presetList[0] ||
      null;

    if (preset?.id) normalized.systemPromptPresetId = preset.id;

    const hasBaseSystemPrompt =
      Object.prototype.hasOwnProperty.call(base, "systemPrompt") && typeof base.systemPrompt === "string";

    if (forceSystemPrompt || !hasBaseSystemPrompt || typeof normalized.systemPrompt !== "string") {
      normalized.systemPrompt = preset?.systemPrompt || "";
    }

    settings.value = normalized;
  }

  async function refreshChatMeta({ silent = false } = {}) {
    try {
      const meta = await getChatMeta();

      const mappedProviders = (meta?.providers || []).map(mapProvider).filter(Boolean);
      providers.value = mappedProviders;
      chatDefaults.value = mapMetaDefaults(meta?.defaults);

      normalizeSettings();
      persistCurrentSettings();

      return meta;
    } catch (error) {
      handleApiError(error, { silent });
      return null;
    }
  }

  async function refreshPromptPresets({ silent = false, forceSystemPrompt = false } = {}) {
    try {
      const rawPresets = await listChatPresets();
      const mapped = rawPresets.map(mapPreset).filter((p) => p && p.id);
      promptPresets.value = mapped;

      normalizeSettings({ forceSystemPrompt });
      persistCurrentSettings();

      return promptPresets.value;
    } catch (error) {
      handleApiError(error, { silent });
      return promptPresets.value;
    }
  }

  async function createPromptPreset(payload) {
    try {
      const preset = await createChatPreset(payload);
      await refreshPromptPresets({ silent: true, forceSystemPrompt: true });
      return preset;
    } catch (error) {
      handleApiError(error, { silent: true });
      throw error;
    }
  }

  async function updatePromptPreset(presetId, payload) {
    try {
      const preset = await updateChatPreset(presetId, payload);
      await refreshPromptPresets({ silent: true, forceSystemPrompt: true });
      return preset;
    } catch (error) {
      handleApiError(error, { silent: true });
      throw error;
    }
  }

  async function deletePromptPreset(presetId) {
    try {
      await deleteChatPreset(presetId);
      await refreshPromptPresets({ silent: true, forceSystemPrompt: true });
    } catch (error) {
      handleApiError(error, { silent: true });
      throw error;
    }
  }

  async function uploadPromptPresetAvatar(presetId, file) {
    try {
      const preset = await uploadChatPresetAvatar(presetId, file);
      await refreshPromptPresets({ silent: true, forceSystemPrompt: true });
      return preset;
    } catch (error) {
      handleApiError(error, { silent: true });
      throw error;
    }
  }

  return {
    providers,
    promptPresets,
    chatDefaults,
    settings,
    normalizeSettings,
    persistCurrentSettings,
    refreshChatMeta,
    refreshPromptPresets,
    createPromptPreset,
    updatePromptPreset,
    deletePromptPreset,
    uploadPromptPresetAvatar,
  };
}
