import { DEFAULT_SESSION_TITLE } from "@/config/chat";

export function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

export function formatSessionTitleFromMessage(messageText) {
  const normalized = String(messageText || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return DEFAULT_SESSION_TITLE;
  return normalized.length > 22 ? `${normalized.slice(0, 22)}…` : normalized;
}

export function isAbortError(error) {
  return error?.name === "AbortError" || /abort/i.test(String(error?.message || ""));
}
