/**
 * arabicNormalize.ts
 * -------------------
 * Normalizes Arabic text for SEARCH purposes only. The normalized string is
 * NEVER shown to the user and NEVER replaces the original Quranic text.
 *
 * Normalization policy (documented deliberately, see README "سياسة التطبيع"):
 *   1. Strip all combining diacritics / Quranic annotation marks (harakat,
 *      sukoon, shadda, tanween, small Quranic signs such as the small high
 *      seen, dagger alif mark, etc.) — anything in Unicode category Mn, plus
 *      the Quranic-specific marks in the 06D6–06ED / 08D4–08FF ranges.
 *   2. Remove the Arabic tatweel/kashida (ـ, U+0640) — purely typographic,
 *      never semantically meaningful.
 *   3. Unify Alef forms (أ إ آ ٱ) to bare Alef (ا) — these differ only by
 *      hamza/madda marks that most users do not type when searching. The
 *      Quranic "dagger alif" (ٰ, U+0670) is stripped like other diacritics
 *      (NOT expanded to ا): the Uthmani rasm uses it inconsistently —
 *      sometimes standing in for a written alef that standard spelling
 *      *does* include (ٱلْعَٰلَمِينَ → العالمين), sometimes marking a long
 *      vowel that standard spelling *omits* (ٱلرَّحْمَٰنِ → الرحمن, no
 *      alef). Because that choice is lexical, not algorithmic, this
 *      function cannot resolve it correctly from the character alone.
 *      The app therefore does not search the Uthmani text directly — see
 *      scripts/build-data.mts, which builds the search index from
 *      Tanzil's standard-orthography ("simple-clean") text instead, and
 *      separately aligns it word-by-word back onto the Uthmani text for
 *      highlighting.
 *   4. Unify Alef Maksura (ى) with Yeh (ي) — extremely common interchange
 *      in everyday typing.
 *   5. Unify Teh Marbuta (ة) with Heh (ه) — standard practice in Arabic
 *      search engines (e.g. Lucene's ArabicNormalizer) because users rarely
 *      distinguish them when typing a query.
 *
 * We deliberately do NOT perform broader substitutions (e.g. merging Hamza
 * carriers ؤ/ئ with ء, or stemming/root-reduction) because that class of
 * change risks misleading matches between unrelated words — forbidden by
 * the spec ("عدم إجراء استبدالات واسعة تؤدي إلى مطابقات مضللة").
 *
 * The function also returns a `map` from each kept character's position in
 * the NORMALIZED string back to its position in the ORIGINAL string. This
 * lets the UI highlight matches in the original, fully-vocalized text even
 * though matching happens on the normalized text.
 */

// Combining marks / Quranic annotation signs to strip entirely.
// Covers: Arabic diacritics block (064B-065F), superscript alef (0670),
// Quranic annotation signs (06D6-06ED), small Quranic marks (08D4-08FF: Mn).
const DIACRITIC_RANGES: Array<[number, number]> = [
  [0x064b, 0x065f], // fathatan..wavy hamza below / small marks
  [0x0610, 0x061a], // honorific/Quranic annotation signs
  [0x0670, 0x0670], // superscript alef (dagger alif) — see policy note above
  [0x06d6, 0x06dc], // small high marks
  [0x06df, 0x06e4], // small high marks
  [0x06e5, 0x06e6], // small waw/yeh (silent wasl-pronunciation guides after
  // a pronoun ه, e.g. بِهِۦ، لَهُۥ — NOT real letters. Unicode classifies
  // these as "Lm" (modifier letter), not a combining mark, so a generic
  // \p{Mn} strip would miss them; they must be listed explicitly.
  [0x06e7, 0x06e8], // small high yeh / noon
  [0x06ea, 0x06ed], // empty centre marks, small low meem
  [0x08d4, 0x08e1], // Quranic annotation marks (extended)
  [0x08e3, 0x08ff], // more Quranic marks / Mn extensions
];

const TATWEEL = 0x0640;

function isDiacritic(code: number): boolean {
  if (code === TATWEEL) return true;
  for (const [start, end] of DIACRITIC_RANGES) {
    if (code >= start && code <= end) return true;
  }
  return false;
}

// Single-character substitutions applied to every *kept* character.
function substitute(ch: string): string {
  switch (ch) {
    case "أ":
    case "إ":
    case "آ":
    case "ٱ":
    case "ﺃ":
    case "ﺇ":
    case "ﺁ":
      return "ا";
    case "ى":
    case "ﯨ":
    case "ﯩ":
      return "ي";
    case "ة":
      return "ه";
    default:
      return ch;
  }
}

export interface NormalizeResult {
  /** Normalized text, safe for matching only — never for display. */
  normalized: string;
  /**
   * map[i] = index of the character in the ORIGINAL string that produced
   * normalized[i]. Used to translate a match range back onto the original,
   * fully-vocalized text for highlighting.
   */
  map: number[];
}

/**
 * Normalize a string of Arabic (or mixed) text for search indexing/matching.
 * Preserves the original text; this function only ever returns a derived
 * copy plus an index map.
 */
export function normalizeArabic(input: string): NormalizeResult {
  const normalizedChars: string[] = [];
  const map: number[] = [];

  // Iterate by code point (not UTF-16 code unit) to be safe with any
  // astral-plane characters, though Arabic script is in the BMP.
  const chars = Array.from(input);
  let origIndex = 0;
  for (const ch of chars) {
    const code = ch.codePointAt(0) ?? 0;
    if (isDiacritic(code)) {
      origIndex += ch.length;
      continue;
    }
    normalizedChars.push(substitute(ch));
    map.push(origIndex);
    origIndex += ch.length;
  }

  return { normalized: normalizedChars.join(""), map };
}

/**
 * Convenience helper: normalize and return just the string (for query
 * normalization, where we don't need the index map).
 */
export function normalizeQuery(input: string): string {
  return normalizeArabic(input).normalized;
}

/** Split a normalized query into non-empty whitespace-separated tokens. */
export function tokenize(normalized: string): string[] {
  return normalized.split(/\s+/).filter(Boolean);
}
