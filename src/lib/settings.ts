/**
 * settings.ts — small user preferences in localStorage (per spec 10.2: use
 * localStorage only for small settings, IndexedDB for bookmarks/position).
 */
import {
  DEFAULT_PRAYER_SETTINGS,
  DEFAULT_READER_SETTINGS,
  type PrayerSettings,
  type ReaderSettings,
} from "./types";

const READER_KEY = "quran:reader-settings:v1";
const PRAYER_KEY = "quran:prayer-settings:v1";

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch (err) {
    console.warn(`settings: failed to read ${key}`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`settings: failed to write ${key}`, err);
    return false;
  }
}

export function getReaderSettings(): ReaderSettings {
  return safeGet(READER_KEY, DEFAULT_READER_SETTINGS);
}

export function setReaderSettings(s: ReaderSettings): boolean {
  return safeSet(READER_KEY, s);
}

export function getPrayerSettings(): PrayerSettings {
  return safeGet(PRAYER_KEY, DEFAULT_PRAYER_SETTINGS);
}

export function setPrayerSettings(s: PrayerSettings): boolean {
  return safeSet(PRAYER_KEY, s);
}
