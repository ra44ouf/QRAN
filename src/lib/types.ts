export interface ChapterMeta {
  id: number; // 1..114, matches Mushaf order
  name: string; // Arabic name, e.g. الفاتحة
  transliteration: string;
  translation: string;
  type: "meccan" | "medinan";
  totalVerses: number;
  hasTafsir: boolean;
}

export interface Ayah {
  surah: number;
  ayah: number;
  text: string; // original Uthmani text, fully vocalized — never modified
}

export interface TafsirEntry {
  surah: number;
  ayah: number;
  text: string;
}

export interface SearchIndexEntry {
  s: number; // surah
  a: number; // ayah
  t: string; // original Uthmani display text — never modified
  /**
   * Precomputed (build-time) normalized text used for MATCHING, built from
   * Tanzil's standard-orthography ("simple-clean") wording — not derived
   * character-by-character from `t`. See scripts/build-data.mts and the
   * policy note in arabicNormalize.ts for why.
   */
  n: string;
  /** [start,end) char offsets of each word of `n`, in order. */
  sOff: [number, number][];
  /** [start,end) char offsets of each word of `t`, in order. */
  uOff: [number, number][];
  /**
   * align[i] = index into uOff for the i-th word of `n`, or -1 when the
   * build-time aligner could not confidently match that word to a word in
   * `t` (rare — see build-data.mts). A -1 means: still a correct match,
   * just no precise highlight for that particular word.
   */
  align: number[];
}

export interface SearchResult {
  surah: number;
  ayah: number;
  text: string;
  /** [start, end) ranges in the ORIGINAL text to highlight */
  ranges: [number, number][];
}

export type ReadingMode = "paged" | "scroll";

export type ReadingBackground =
  | "pure-white"
  | "warm-white"
  | "ivory"
  | "snow-blue"
  | "pale-blue"
  | "glass"
  // Dim background for the reading page/paper itself only — NOT the
  // app's general theme, which stays light-only everywhere else (nav,
  // settings, cards). Added on request for comfortable long reading
  // sessions in low light.
  | "night";

export interface Bookmark {
  id: string; // `${surah}:${ayah}`
  surah: number;
  ayah: number;
  surahName: string;
  createdAt: number;
  note?: string;
}

export interface LastPosition {
  id: "current";
  surah: number;
  ayah: number;
  scrollOffset?: number;
  updatedAt: number;
}

export interface ReaderSettings {
  fontSizePx: number;
  background: ReadingBackground;
  mode: ReadingMode;
  showTafsirInline: boolean;
}

export interface PrayerSettings {
  cityId: string | null;
  customLat: number | null;
  customLng: number | null;
  customLabel: string | null;
  calculationMethod: string; // adhan.js CalculationMethod key
  madhab: "shafi" | "hanafi";
  useGeolocation: boolean;
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSizePx: 32,
  background: "ivory",
  mode: "scroll",
  showTafsirInline: false,
};

export const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  cityId: "makkah",
  customLat: null,
  customLng: null,
  customLabel: null,
  calculationMethod: "UmmAlQura",
  madhab: "shafi",
  useGeolocation: false,
};
