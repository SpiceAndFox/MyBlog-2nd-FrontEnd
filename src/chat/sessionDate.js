import { DEFAULT_SESSION_TITLE } from "@/config/chat";

export function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

export function formatLocalDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getSessionDateKey(session) {
  const title = String(session?.title || "").trim();
  if (isDateKey(title)) return title;

  const fallbackRaw = session?.createdAt || session?.created_at || session?.updatedAt || session?.updated_at;
  const fallback = formatLocalDateKey(fallbackRaw);
  return fallback || title || DEFAULT_SESSION_TITLE;
}

