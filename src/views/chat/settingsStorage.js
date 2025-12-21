import { SETTINGS_STORAGE_KEY } from "./constants";
import { isPlainObject } from "./helpers";

export function loadPersistedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistSettings(nextSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  } catch {
    // ignore
  }
}
