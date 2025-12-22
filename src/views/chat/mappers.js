import { DEFAULT_SESSION_TITLE } from "./constants";
import { createId, isPlainObject } from "./helpers";

export function mapPreset(raw) {
  if (!raw) return null;
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    systemPrompt: typeof raw.systemPrompt === "string" ? raw.systemPrompt : "",
    avatarUrl: typeof raw.avatarUrl === "string" ? raw.avatarUrl.trim() : "",
    isBuiltin: Boolean(raw.isBuiltin ?? raw.is_builtin),
  };
}

function mapModel(raw) {
  if (!raw) return null;
  const id = String(raw.id ?? "").trim();
  if (!id) return null;
  const name = String(raw.name ?? id).trim() || id;
  return { id, name };
}

function mapSettingOption(raw) {
  if (!raw) return null;
  const value = String(raw.value ?? "").trim();
  if (!value) return null;
  const label = String(raw.label ?? value).trim() || value;
  return { value, label };
}

function mapSettingsSchemaControl(raw) {
  if (!isPlainObject(raw)) return null;
  const key = String(raw.key ?? "").trim();
  if (!key) return null;
  const label = String(raw.label ?? key).trim() || key;
  const type = String(raw.type ?? "").trim();
  if (!type) return null;

  const capability = typeof raw.capability === "string" ? raw.capability.trim() : "";
  const min = Number(raw.min);
  const max = Number(raw.max);
  const step = Number(raw.step);
  const decimals = Number(raw.decimals);

  const modelBlocklist = (Array.isArray(raw.modelBlocklist) ? raw.modelBlocklist : [])
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean);

  const options = (Array.isArray(raw.options) ? raw.options : []).map(mapSettingOption).filter(Boolean);
  const defaultValue = raw.default;

  return {
    key,
    label,
    type,
    capability,
    min: Number.isFinite(min) ? min : undefined,
    max: Number.isFinite(max) ? max : undefined,
    step: Number.isFinite(step) ? step : undefined,
    decimals: Number.isFinite(decimals) ? decimals : undefined,
    modelBlocklist,
    options,
    default: defaultValue,
  };
}

export function mapProvider(raw) {
  if (!raw) return null;
  const id = String(raw.id ?? "").trim();
  if (!id) return null;
  const name = String(raw.name ?? id).trim() || id;
  const models = (Array.isArray(raw.models) ? raw.models : []).map(mapModel).filter(Boolean);
  if (!models.length) return null;
  const capabilities = isPlainObject(raw.capabilities) ? raw.capabilities : {};
  const defaults = isPlainObject(raw.defaults) ? raw.defaults : {};
  const adapter = typeof raw.adapter === "string" ? raw.adapter : "";
  const settingsSchema = (Array.isArray(raw.settingsSchema) ? raw.settingsSchema : [])
    .map(mapSettingsSchemaControl)
    .filter(Boolean);
  return { id, name, models, capabilities, defaults, adapter, settingsSchema };
}

export function mapMetaDefaults(rawDefaults) {
  const defaults = isPlainObject(rawDefaults) ? rawDefaults : {};

  const mapped = {};

  if (typeof defaults.providerId === "string") mapped.providerId = defaults.providerId.trim();
  if (typeof defaults.modelId === "string") mapped.modelId = defaults.modelId.trim();
  if (typeof defaults.systemPromptPresetId === "string") mapped.systemPromptPresetId = defaults.systemPromptPresetId.trim();

  const temperature = Number(defaults.temperature);
  if (Number.isFinite(temperature)) mapped.temperature = temperature;

  const topP = Number(defaults.topP);
  if (Number.isFinite(topP)) mapped.topP = topP;

  const maxOutputTokens = Number(defaults.maxOutputTokens);
  if (Number.isFinite(maxOutputTokens)) mapped.maxOutputTokens = maxOutputTokens;

  const presencePenalty = Number(defaults.presencePenalty);
  if (Number.isFinite(presencePenalty)) mapped.presencePenalty = presencePenalty;

  const frequencyPenalty = Number(defaults.frequencyPenalty);
  if (Number.isFinite(frequencyPenalty)) mapped.frequencyPenalty = frequencyPenalty;

  if (typeof defaults.stream === "boolean") mapped.stream = defaults.stream;
  if (typeof defaults.enableWebSearch === "boolean") mapped.enableWebSearch = defaults.enableWebSearch;

  return mapped;
}

export function mapSession(raw) {
  if (!raw) return null;
  return {
    id: String(raw.id ?? ""),
    title: raw.title || DEFAULT_SESSION_TITLE,
    settings: raw.settings || {},
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
  };
}

export function mapMessage(raw) {
  if (!raw) return null;
  const id = String(raw.id ?? "");
  return {
    id,
    clientId: id || createId("msg"),
    role: raw.role,
    content: raw.content || "",
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}
