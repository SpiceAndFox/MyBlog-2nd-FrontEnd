import { DEFAULT_SESSION_TITLE } from "@/config/chat";
import { CHAT_DAY_TIME_ZONE } from "@/config/chat";

let chatDayFormatter = null;
let chatDayDateTimeFormatter = null;

function getChatDayFormatter() {
  if (chatDayFormatter) return chatDayFormatter;
  chatDayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CHAT_DAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return chatDayFormatter;
}

function getChatDayDateTimeFormatter() {
  if (chatDayDateTimeFormatter) return chatDayDateTimeFormatter;
  chatDayDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CHAT_DAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return chatDayDateTimeFormatter;
}

function getPart(parts, type) {
  return parts.find((part) => part.type === type)?.value;
}

function getZonedParts(date) {
  const parts = getChatDayDateTimeFormatter().formatToParts(date);
  const year = Number.parseInt(getPart(parts, "year"), 10);
  const month = Number.parseInt(getPart(parts, "month"), 10);
  const day = Number.parseInt(getPart(parts, "day"), 10);
  const hour = Number.parseInt(getPart(parts, "hour"), 10);
  const minute = Number.parseInt(getPart(parts, "minute"), 10);
  const second = Number.parseInt(getPart(parts, "second"), 10);

  return {
    year: Number.isFinite(year) ? year : 0,
    month: Number.isFinite(month) ? month : 1,
    day: Number.isFinite(day) ? day : 1,
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
    second: Number.isFinite(second) ? second : 0,
  };
}

export function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

export function formatLocalDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  try {
    const parts = getChatDayFormatter().formatToParts(date);
    const year = getPart(parts, "year");
    const month = getPart(parts, "month");
    const day = getPart(parts, "day");
    if (year && month && day) return `${year}-${month}-${day}`;
  } catch {
    // ignore
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMsUntilNextDayBoundary(value = new Date()) {
  const now = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(now.getTime())) return 60_000;

  try {
    const zonedNow = getZonedParts(now);
    const zonedTodayUtcMidnight = Date.UTC(zonedNow.year, zonedNow.month - 1, zonedNow.day, 0, 0, 0);
    const zonedTomorrow = new Date(zonedTodayUtcMidnight + 24 * 60 * 60 * 1000);

    const desired = {
      year: zonedTomorrow.getUTCFullYear(),
      month: zonedTomorrow.getUTCMonth() + 1,
      day: zonedTomorrow.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
    };

    let utcGuess = Date.UTC(desired.year, desired.month - 1, desired.day, desired.hour, desired.minute, desired.second);
    for (let i = 0; i < 3; i += 1) {
      const guessParts = getZonedParts(new Date(utcGuess));
      const guessAsUtc = Date.UTC(
        guessParts.year,
        guessParts.month - 1,
        guessParts.day,
        guessParts.hour,
        guessParts.minute,
        guessParts.second
      );
      const desiredAsUtc = Date.UTC(
        desired.year,
        desired.month - 1,
        desired.day,
        desired.hour,
        desired.minute,
        desired.second
      );
      const diff = desiredAsUtc - guessAsUtc;
      utcGuess += diff;
      if (diff === 0) break;
    }

    return Math.max(0, utcGuess - now.getTime());
  } catch {
    return 60_000;
  }
}

export function getSessionDateKey(session) {
  const title = String(session?.title || "").trim();
  if (isDateKey(title)) return title;

  const fallbackRaw = session?.createdAt || session?.created_at || session?.updatedAt || session?.updated_at;
  const fallback = formatLocalDateKey(fallbackRaw);
  return fallback || title || DEFAULT_SESSION_TITLE;
}
