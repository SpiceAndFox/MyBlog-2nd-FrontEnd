export { formatLocalDateKey, getSessionDateKey, isDateKey } from "@/chat/sessionDate";

export function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

export function isAbortError(error) {
  return error?.name === "AbortError" || /abort/i.test(String(error?.message || ""));
}
