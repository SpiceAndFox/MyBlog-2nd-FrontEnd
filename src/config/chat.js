export const CHAT_PROMPT_PRESETS = [
  {
    id: "default",
    name: "默认",
    systemPrompt: "你是一个专业、耐心、可靠的助手。请用中文回答，必要时给出清晰步骤与示例。",
  },
  {
    id: "neko",
    name: "Neko",
    systemPrompt: "你是一位猫娘女仆",
  },
];

export const CHAT_PROVIDERS = [
  {
    id: "grok",
    name: "Grok (xAI)",
    models: [
      { id: "grok-4", name: "grok-4" },
      {
        id: "grok-4-fast-non-reasoning",
        name: "grok-4-fast-non-reasoning",
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    models: [
      { id: "deepseek-chat", name: "deepseek-chat" },
      { id: "deepseek-reasoner", name: "deepseek-reasoner" },
    ],
  },
];

const DEFAULT_SYSTEM_PROMPT = CHAT_PROMPT_PRESETS.find((preset) => preset.id === "default")?.systemPrompt || "";

export const CHAT_DEFAULT_SETTINGS = {
  providerId: "deepseek",
  modelId: "deepseek-chat",
  temperature: 0.7,
  topP: 0.9,
  maxOutputTokens: 4096,
  presencePenalty: 0,
  frequencyPenalty: 0,
  stream: true,
  enableWebSearch: false,
  systemPromptPresetId: "default",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
};

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function pickProvider(providerId) {
  const normalizedId = String(providerId || "").trim();
  return CHAT_PROVIDERS.find((provider) => provider.id === normalizedId) || CHAT_PROVIDERS[0] || null;
}

function pickModel(provider, modelId) {
  const models = provider?.models || [];
  const normalizedId = String(modelId || "").trim();
  return models.find((model) => model.id === normalizedId) || models[0] || null;
}

function pickPreset(presetId) {
  const normalizedId = String(presetId || "").trim();
  return CHAT_PROMPT_PRESETS.find((preset) => preset.id === normalizedId) || null;
}

function toNumberOrFallback(value, fallbackValue) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallbackValue;
}

export function normalizeChatSettings(rawSettings) {
  const base = isPlainObject(rawSettings) ? rawSettings : {};
  const normalized = { ...CHAT_DEFAULT_SETTINGS, ...base };

  const provider = pickProvider(normalized.providerId);
  normalized.providerId = provider?.id || CHAT_DEFAULT_SETTINGS.providerId;

  const model = pickModel(provider, normalized.modelId);
  normalized.modelId = model?.id || CHAT_DEFAULT_SETTINGS.modelId;

  normalized.temperature = toNumberOrFallback(normalized.temperature, CHAT_DEFAULT_SETTINGS.temperature);
  normalized.topP = toNumberOrFallback(normalized.topP, CHAT_DEFAULT_SETTINGS.topP);
  normalized.maxOutputTokens = toNumberOrFallback(normalized.maxOutputTokens, CHAT_DEFAULT_SETTINGS.maxOutputTokens);
  normalized.presencePenalty = toNumberOrFallback(normalized.presencePenalty, CHAT_DEFAULT_SETTINGS.presencePenalty);
  normalized.frequencyPenalty = toNumberOrFallback(normalized.frequencyPenalty, CHAT_DEFAULT_SETTINGS.frequencyPenalty);

  normalized.stream = typeof normalized.stream === "boolean" ? normalized.stream : CHAT_DEFAULT_SETTINGS.stream;
  normalized.enableWebSearch =
    typeof normalized.enableWebSearch === "boolean"
      ? normalized.enableWebSearch
      : CHAT_DEFAULT_SETTINGS.enableWebSearch;

  const preset = pickPreset(normalized.systemPromptPresetId) || pickPreset(CHAT_DEFAULT_SETTINGS.systemPromptPresetId);
  normalized.systemPromptPresetId = preset?.id || CHAT_DEFAULT_SETTINGS.systemPromptPresetId;

  if (!Object.prototype.hasOwnProperty.call(base, "systemPrompt") || typeof normalized.systemPrompt !== "string") {
    normalized.systemPrompt = preset?.systemPrompt || CHAT_DEFAULT_SETTINGS.systemPrompt;
  }

  return normalized;
}
