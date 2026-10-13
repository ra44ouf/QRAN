/**
 * queryIntent.ts
 * ---------------
 * When someone searches for "تفسير آية الكرسي" or "تفسير سورة البقرة آية
 * 255", plain text search isn't the right tool — they want to jump
 * straight to that ayah's tafsir. This detects that intent and returns a
 * direct (surah, ayah) target, so the UI can show a "direct result" card
 * above the normal text-search results instead of forcing the user to dig
 * for it.
 *
 * Deliberately conservative: only fires when the query clearly signals
 * tafsir intent (contains "تفسير") AND we can confidently resolve a
 * specific ayah — never guesses on an ambiguous query.
 */
import { normalizeArabic } from "./arabicNormalize";
import type { ChapterMeta } from "./types";

/** Well-known ayah nicknames. Only well-established, unambiguous ones. */
const KNOWN_NICKNAMES: [pattern: string, surah: number, ayah: number][] = [
  ["آية الكرسي", 2, 255],
  ["ايه الكرسي", 2, 255],
  ["آية النور", 24, 35],
  ["ايه النور", 24, 35],
  ["آية الدين", 2, 282],
  ["ايه الدين", 2, 282],
  ["آية المداينة", 2, 282],
  ["آية الوضوء", 5, 6],
  ["ايه الوضوء", 5, 6],
];

const ARABIC_INDIC_DIGITS: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

function toWesternDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => ARABIC_INDIC_DIGITS[d] ?? d);
}

export interface TafsirIntentResult {
  surah: number;
  ayah: number;
  surahName: string;
  matchedVia: "nickname" | "surah+number";
}

export function detectTafsirIntent(
  rawQuery: string,
  chapters: ChapterMeta[],
): TafsirIntentResult | null {
  const query = rawQuery.trim();
  if (query.length === 0 || chapters.length === 0) return null;

  const normalized = normalizeArabic(query).normalized;
  const mentionsTafsir = normalized.includes("تفسير");
  if (!mentionsTafsir) return null;

  // 1) Known nicknames (checked against the raw query so hamza/alef forms
  // in the nickname list match naturally without over-normalizing).
  for (const [pattern, surah, ayah] of KNOWN_NICKNAMES) {
    if (query.includes(pattern)) {
      const chapter = chapters.find((c) => c.id === surah);
      if (chapter && ayah <= chapter.totalVerses) {
        return { surah, ayah, surahName: chapter.name, matchedVia: "nickname" };
      }
    }
  }

  // 2) Surah name + ayah number anywhere in the query.
  const digits = toWesternDigits(query).match(/\d+/);
  if (!digits) return null;
  const ayahNum = Number(digits[0]);
  if (!Number.isFinite(ayahNum) || ayahNum < 1) return null;

  // Match the longest chapter name found in the query (avoids a short
  // name accidentally matching inside a longer one).
  let bestMatch: ChapterMeta | null = null;
  for (const c of chapters) {
    if (query.includes(c.name) && (!bestMatch || c.name.length > bestMatch.name.length)) {
      bestMatch = c;
    }
  }
  if (!bestMatch) return null;
  if (ayahNum > bestMatch.totalVerses) return null; // out of range — don't guess

  return { surah: bestMatch.id, ayah: ayahNum, surahName: bestMatch.name, matchedVia: "surah+number" };
}
