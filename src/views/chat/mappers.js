import { DEFAULT_SESSION_TITLE } from "./constants";
import { isPlainObject } from "./helpers";

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

export function mapProvider(raw) {
  if (!raw) return null;
  const id = String(raw.id ?? "").trim();
  if (!id) return null;
  const name = String(raw.name ?? id).trim() || id;
  const models = (Array.isArray(raw.models) ? raw.models : []).map(mapModel).filter(Boolean);
  if (!models.length) return null;
  return { id, name, models };
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
  return {
    id: String(raw.id ?? ""),
    role: raw.role,
    content: raw.content || "",
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}
