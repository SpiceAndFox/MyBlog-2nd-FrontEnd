import { ref } from "vue";
import {
  createChatPreset,
  deleteChatPreset,
  getChatMeta,
  listChatPresets,
  updateChatPreset,
  uploadChatPresetAvatar,
} from "@/api/chat";
import { DEFAULT_PROMPT_PRESET_ID } from "@/config/chat";
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

  function splitPath(path) {
    return String(path || "")
      .split(".")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function getValueByPath(target, path) {
    const parts = splitPath(path);
    if (!parts.length) return undefined;
    let current = target;
    for (const part of parts) {
      if (!isPlainObject(current) && typeof current !== "object") return undefined;
      current = current?.[part];
      if (current === undefined) return undefined;
    }
    return current;
  }

  function setValueByPath(target, path, value) {
    const parts = splitPath(path);
    if (!parts.length) return;
    let current = target;
    for (let index = 0; index < parts.length - 1; index += 1) {
      const part = parts[index];
      if (!isPlainObject(current[part])) current[part] = {};
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }

  function clampNumber(value, { min, max } = {}) {
    const number = Number(value);
    if (!Number.isFinite(number)) return undefined;
    const normalizedMin = Number(min);
    const normalizedMax = Number(max);
    if (!Number.isFinite(normalizedMin) || !Number.isFinite(normalizedMax)) return number;
    return Math.min(normalizedMax, Math.max(normalizedMin, number));
  }

  function coerceControlValue(control, rawValue) {
    if (!control) return undefined;
    const type = String(control.type || "").trim();

    if (type === "toggle") {
      if (typeof rawValue === "boolean") return rawValue;
      return undefined;
    }

    if (type === "range" || type === "number") {
      return clampNumber(rawValue, control);
    }

    if (type === "select") {
      const options = Array.isArray(control.options) ? control.options : [];
      const allowed = new Set(options.map((option) => String(option?.value ?? "")));
      const normalized = rawValue === undefined || rawValue === null ? "" : String(rawValue);
      if (normalized && allowed.has(normalized)) return normalized;

      const fallbackDefault = control.default === undefined || control.default === null ? "" : String(control.default);
      if (fallbackDefault && allowed.has(fallbackDefault)) return fallbackDefault;

      const first = options[0]?.value;
      return first === undefined || first === null ? "" : String(first);
    }

    return undefined;
  }

  function isControlSupportedByProvider(control, provider) {
    if (!control) return false;
    const capability = String(control.capability || "").trim();
    if (capability && provider?.capabilities?.[capability] === false) return false;
    return true;
  }

  function isControlAllowedForModel(control, modelId) {
    const blocklist = Array.isArray(control.modelBlocklist) ? control.modelBlocklist : [];
    if (blocklist.length && blocklist.includes(String(modelId || ""))) return false;
    return true;
  }

  function normalizeSettings({ forceSystemPrompt = false } = {}) {
    const base = isPlainObject(settings.value) ? settings.value : {};
    const defaults = isPlainObject(chatDefaults.value) ? chatDefaults.value : {};

    const merged = { ...defaults, ...base };

    const providerList = Array.isArray(providers.value) ? providers.value : [];
    const desiredProviderId = String(merged.providerId || "").trim();
    const defaultProviderId = String(defaults.providerId || "").trim();

    const provider =
      providerList.find((p) => p.id === desiredProviderId) ||
      providerList.find((p) => p.id === defaultProviderId) ||
      providerList[0] ||
      null;

    const providerId = provider?.id ? provider.id : defaultProviderId;
    const providerDefaults = isPlainObject(provider?.defaults) ? provider.defaults : defaults;

    const models = provider?.models || [];
    const desiredModelId = String(merged.modelId || "").trim();
    const fallbackModelId = String(providerDefaults.modelId || defaults.modelId || "").trim();

    const model =
      models.find((m) => m.id === desiredModelId) ||
      models.find((m) => m.id === fallbackModelId) ||
      models[0] ||
      null;

    const modelId = model?.id ? model.id : "";

    const normalized = {
      providerId: providerId || "",
      modelId,
    };

    const schema = Array.isArray(provider?.settingsSchema) ? provider.settingsSchema : [];
    for (const control of schema) {
      if (!control?.key) continue;
      if (!isControlSupportedByProvider(control, provider)) continue;
      const isAllowedForModel = isControlAllowedForModel(control, modelId);

      let nextValue = coerceControlValue(control, getValueByPath(base, control.key));
      if (nextValue === undefined && isAllowedForModel)
        nextValue = coerceControlValue(control, getValueByPath(providerDefaults, control.key));
      if (nextValue === undefined && isAllowedForModel)
        nextValue = coerceControlValue(control, getValueByPath(defaults, control.key));
      if (nextValue === undefined && isAllowedForModel && control.default !== undefined)
        nextValue = coerceControlValue(control, control.default);

      if (nextValue !== undefined) setValueByPath(normalized, control.key, nextValue);
    }

    const providerSupportsWebSearch = provider?.capabilities?.webSearch !== false;
    if (!providerSupportsWebSearch) {
      normalized.enableWebSearch = false;
    } else if (typeof base.enableWebSearch === "boolean") {
      normalized.enableWebSearch = base.enableWebSearch;
    } else if (typeof providerDefaults.enableWebSearch === "boolean") {
      normalized.enableWebSearch = providerDefaults.enableWebSearch;
    } else if (typeof defaults.enableWebSearch === "boolean") {
      normalized.enableWebSearch = defaults.enableWebSearch;
    }

    normalized.stream =
      typeof normalized.stream === "boolean"
        ? normalized.stream
        : typeof base.stream === "boolean"
        ? base.stream
        : typeof providerDefaults.stream === "boolean"
        ? providerDefaults.stream
        : defaults.stream;

    const presetList = Array.isArray(promptPresets.value) ? promptPresets.value : [];
    const desiredPresetId = String(merged.systemPromptPresetId || "").trim();
    const defaultPresetId = String(defaults.systemPromptPresetId || "").trim();

    let preset = null;
    if (presetList.length) {
      preset =
        presetList.find((p) => p.id === desiredPresetId) ||
        presetList.find((p) => p.id === defaultPresetId) ||
        presetList.find((p) => p.id === DEFAULT_PROMPT_PRESET_ID) ||
        presetList[0] ||
        null;

      if (preset?.id) normalized.systemPromptPresetId = preset.id;
    } else {
      const fallbackPresetId = desiredPresetId || defaultPresetId || DEFAULT_PROMPT_PRESET_ID;
      if (fallbackPresetId) normalized.systemPromptPresetId = fallbackPresetId;
    }

    const hasBaseSystemPrompt =
      Object.prototype.hasOwnProperty.call(base, "systemPrompt") && typeof base.systemPrompt === "string";

    if (forceSystemPrompt || !hasBaseSystemPrompt || typeof merged.systemPrompt !== "string") {
      normalized.systemPrompt = preset?.systemPrompt || "";
    } else {
      normalized.systemPrompt = merged.systemPrompt;
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
