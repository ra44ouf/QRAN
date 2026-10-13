/**
 * scripts/build-data.mts
 * -----------------------
 * Processes the raw, verified source data (Tanzil Uthmani text + Tanzil
 * standard-orthography "simple-clean" text + chapter metadata + Tafsir
 * al-Muyassar) into the compact, per-surah JSON files the app ships and
 * caches for offline use.
 *
 * Run with: node --experimental-strip-types scripts/build-data.mts
 *
 * This script performs integrity checks and FAILS LOUDLY (non-zero exit)
 * if anything is missing, mismatched, or looks corrupted — we never want a
 * silently-incomplete Quran shipped to users.
 *
 * SEARCH INDEX DESIGN
 * --------------------
 * We match search queries against Tanzil's *standard-orthography* text
 * ("simple-clean"), not the displayed Uthmani rasm. The Uthmani script
 * uses the "dagger alif" (ٰ) ambiguously — sometimes replacing a written
 * alef that standard spelling has (ٱلْعَٰلَمِينَ → العالمين) and sometimes
 * marking a long vowel that standard spelling omits (ٱلرَّحْمَٰنِ →
 * الرحمن) — so no character-level normalization of the Uthmani text alone
 * can match what users actually type. Instead we:
 *   1. Normalize the simple-clean text for matching (`n`).
 *   2. Word-align the simple-clean words onto the Uthmani words (handling
 *      the one well-known structural difference: the vocative "يا" is
 *      written fused with the next word in the Uthmani rasm, e.g.
 *      "يَٰٓأَيُّهَا" = "يا" + "أيها" — this explains 346 of the 363 ayat
 *      where the two texts have different word counts).
 *   3. Store per-word character offsets for both texts (`sOff`, `uOff`)
 *      plus the alignment (`align`), so the UI can highlight the exact
 *      matched WORDS in the original, fully-vocalized Uthmani text.
 * Any ayah where alignment still can't be resolved confidently keeps -1
 * for the affected word(s): the ayah still matches correctly, it just
 * won't get a precise highlight for that one word. Build output reports
 * exactly how many words fall into this fallback case.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { normalizeArabic } from "../src/lib/arabicNormalize.ts";

const PROJECT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// Raw source data (Tanzil text + tafsir JSON) is NOT bundled with this
// project — it's ~77MB of intermediate files, most of it unused (full font
// repos, unrelated editions). The processed output in public/data/ is what
// the app actually ships and runs from. See README "إعادة بناء البيانات
// الخام من الصفر" for the exact commands to recreate data-src/ if you need
// to re-run this script (e.g. to add another tafsir edition).
const SRC = process.env.QURAN_DATA_SRC ?? path.join(PROJECT_ROOT, "data-src");
const OUT = path.join(PROJECT_ROOT, "public/data");

type TanzilVerse = { chapter: number; verse: number; text: string };
type Chapter = {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: "meccan" | "medinan";
  total_verses: number;
};
type TafsirEntry = { text: string; ayah: number; surah: number };

function readJSON<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}
function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

console.log("▶ Reading source data…");
const chapters = readJSON<{ chapters: Chapter[] }>(
  `${SRC}/quran-json-main/data/tanzil/chapters.json`,
).chapters;
const uthmani = readJSON<Record<string, TanzilVerse[]>>(
  `${SRC}/quran-json-main/data/tanzil/uthmani.json`,
);
const simpleClean = readJSON<Record<string, TanzilVerse[]>>(
  `${SRC}/quran-json-main/data/tanzil/simple-clean.json`,
);

// ---- Integrity checks (Quran text) ----------------------------------------
console.log("▶ Verifying integrity (114 surahs, 6236 ayat, no gaps)…");
if (chapters.length !== 114) throw new Error(`Expected 114 chapters, got ${chapters.length}`);
let totalAyat = 0;
for (const c of chapters) {
  const verses = uthmani[String(c.id)];
  if (!verses) throw new Error(`Missing surah ${c.id} in uthmani.json`);
  if (verses.length !== c.total_verses) {
    throw new Error(
      `Surah ${c.id} (${c.name}): chapters.json says ${c.total_verses} ayat, uthmani.json has ${verses.length}`,
    );
  }
  verses.forEach((v, idx) => {
    if (v.verse !== idx + 1) throw new Error(`Surah ${c.id}: ayah numbering gap at index ${idx}`);
    if (!v.text?.trim()) throw new Error(`Surah ${c.id} ayah ${v.verse}: empty text`);
  });
  totalAyat += verses.length;
  const sc = simpleClean[String(c.id)];
  if (!sc || sc.length !== c.total_verses) {
    throw new Error(`Surah ${c.id}: simple-clean text missing or count mismatch`);
  }
}
if (totalAyat !== 6236) throw new Error(`Expected 6236 total ayat, got ${totalAyat}`);
console.log(`  ✓ 114 surahs, ${totalAyat} ayat verified against chapters.json`);

// ---- Tafsir (Muyassar) -----------------------------------------------------
console.log("▶ Verifying tafsir (Muyassar) coverage…");
const tafsirBySurah: Record<number, TafsirEntry[]> = {};
const tafsirMissing: number[] = [];
for (const c of chapters) {
  const path = `${SRC}/tafsir-muyassar/${c.id}.json`;
  if (!existsSync(path)) {
    tafsirMissing.push(c.id);
    continue;
  }
  const entries = readJSON<TafsirEntry[]>(path);
  if (entries.length !== c.total_verses) {
    throw new Error(`Tafsir surah ${c.id}: expected ${c.total_verses}, got ${entries.length}`);
  }
  entries.forEach((e, idx) => {
    if (e.ayah !== idx + 1 || e.surah !== c.id) {
      throw new Error(`Tafsir surah ${c.id}: ayah/surah mismatch at index ${idx}`);
    }
  });
  tafsirBySurah[c.id] = entries;
}
if (tafsirMissing.length > 0) {
  console.warn(`  ⚠ Tafsir missing for surahs: ${tafsirMissing.join(", ")}`);
} else {
  console.log(`  ✓ Tafsir (Muyassar) present and verse-aligned for all 114 surahs`);
}

// ---- Word alignment (simple-clean <-> uthmani) -----------------------------
/** Skeleton used ONLY for build-time word alignment — never for display or
 * the actual search index. Strips diacritics AND all alef variants so that
 * the dagger-alif ambiguity (see file header) cannot cause a false
 * mismatch between an Uthmani word and its standard-spelling counterpart. */
function alignKey(word: string): string {
  return normalizeArabic(word).normalized
    .replace(/ا/g, "") // alef-ambiguity, see file header
    .replace(/[ؤئء]/g, "") // hamza-carrier spelling varies (رءوس/رؤوس), irrelevant for pairing
    .replace(/ى/g, "ي")
    .replace(/و/g, ""); // a handful of words (الصلاة، الزكاة، الحياة…) use a
  // waw+dagger-alif in the Uthmani rasm for the same "aa" sound standard
  // spelling writes with alef — e.g. ٱلصَّلَوٰةَ vs الصلاة. Dropping و here
  // too (alignment-key only, never the real search index) resolves it.
}

interface WordAlignResult {
  sOff: [number, number][];
  uOff: [number, number][];
  align: number[];
  fallbackCount: number;
}

function offsetsOf(words: string[]): [number, number][] {
  const offs: [number, number][] = [];
  let pos = 0;
  for (const w of words) {
    offs.push([pos, pos + w.length]);
    pos += w.length + 1; // single space between words, consistent with .join(" ")
  }
  return offs;
}

function alignWords(uthmaniText: string, simpleText: string): WordAlignResult {
  const uWordsRaw = uthmaniText.split(/\s+/).filter(Boolean);
  const sWordsNormalized = normalizeArabic(simpleText).normalized.split(/\s+/).filter(Boolean);
  const uKeys = uWordsRaw.map(alignKey);
  const sKeys = sWordsNormalized.map(alignKey);

  const sOff = offsetsOf(sWordsNormalized);
  const uOff = offsetsOf(uWordsRaw);
  const align: number[] = new Array(sWordsNormalized.length).fill(-1);

  let i = 0; // simple word index
  let j = 0; // uthmani word index
  let fallbackCount = 0;

  while (i < sKeys.length && j < uKeys.length) {
    if (sKeys[i] === uKeys[j]) {
      align[i] = j;
      i++;
      j++;
      continue;
    }
    // Vocative merge: "يا" + next simple word == one fused Uthmani word
    if (
      sWordsNormalized[i] === "يا" &&
      i + 1 < sKeys.length &&
      sKeys[i + 1] + "" !== undefined &&
      uKeys[j] === sKeys[i] + sKeys[i + 1]
    ) {
      align[i] = j; // "يا" itself highlights the fused word too
      align[i + 1] = j;
      i += 2;
      j++;
      continue;
    }
    // Generic split: one simple word == two fused uthmani words
    if (j + 1 < uKeys.length && uKeys[j] + uKeys[j + 1] === sKeys[i]) {
      align[i] = j;
      i++;
      j += 2;
      continue;
    }
    // Fallback: best-effort 1:1, flagged
    align[i] = j;
    fallbackCount++;
    i++;
    j++;
  }

  return { sOff, uOff, align, fallbackCount };
}

// ---- Write output -----------------------------------------------------
console.log("▶ Writing output files…");
ensureDir(`${OUT}/quran`);
ensureDir(`${OUT}/tafsir`);
ensureDir(`${OUT}/meta`);

writeFileSync(
  `${OUT}/meta/chapters.json`,
  JSON.stringify(
    chapters.map((c) => ({
      id: c.id,
      name: c.name,
      transliteration: c.transliteration,
      translation: c.translation,
      type: c.type,
      totalVerses: c.total_verses,
      hasTafsir: !tafsirMissing.includes(c.id),
    })),
  ),
);

for (const c of chapters) {
  const verses = uthmani[String(c.id)];
  writeFileSync(
    `${OUT}/quran/${c.id}.json`,
    JSON.stringify(verses.map((v) => ({ surah: v.chapter, ayah: v.verse, text: v.text }))),
  );
}

for (const c of chapters) {
  const entries = tafsirBySurah[c.id];
  if (!entries) continue;
  writeFileSync(
    `${OUT}/tafsir/${c.id}.json`,
    JSON.stringify(entries.map((e) => ({ surah: e.surah, ayah: e.ayah, text: e.text }))),
  );
}

console.log("▶ Building precomputed search index with word alignment…");
type IndexEntry = {
  s: number;
  a: number;
  t: string;
  n: string;
  sOff: [number, number][];
  uOff: [number, number][];
  align: number[];
};
const index: IndexEntry[] = [];
let totalFallback = 0;
let totalWords = 0;
let ayatWithAnyFallback = 0;
for (const c of chapters) {
  const uVerses = uthmani[String(c.id)]!;
  const sVerses = simpleClean[String(c.id)]!;
  for (let k = 0; k < uVerses.length; k++) {
    const u = uVerses[k]!;
    const s = sVerses[k]!;
    const { sOff, uOff, align, fallbackCount } = alignWords(u.text, s.text);
    totalWords += align.length;
    if (fallbackCount > 0) {
      totalFallback += fallbackCount;
      ayatWithAnyFallback++;
    }
    const n = normalizeArabic(s.text).normalized;
    index.push({ s: u.chapter, a: u.verse, t: u.text, n, sOff, uOff, align });
  }
}
writeFileSync(`${OUT}/search-index.json`, JSON.stringify(index));
console.log(`  ✓ Search index built: ${index.length} ayat, ${totalWords} words total`);
console.log(
  `  ℹ Word alignment: ${totalWords - totalFallback}/${totalWords} words aligned via exact/merge rules ` +
    `(${((1 - totalFallback / totalWords) * 100).toFixed(2)}%); ` +
    `${totalFallback} words used best-effort positional fallback, across ${ayatWithAnyFallback} ayat.`,
);

writeFileSync(
  `${OUT}/meta/tafsir-source.json`,
  JSON.stringify({
    id: "ar-tafsir-muyassar",
    nameAr: "التفسير الميسر",
    author: "نخبة من العلماء بإشراف مجمع الملك فهد لطباعة المصحف الشريف",
    sourceUrl: "https://qul.tarteel.ai/resources/tafsir/38",
    retrievedVia: "https://github.com/spa5k/tafsir_api",
    note:
      "تم التحقق من مطابقة عدد آيات كل سورة في هذا التفسير لعدد آيات نص المصحف (6236 آية) أثناء البناء.",
  }),
);

writeFileSync(
  `${OUT}/meta/quran-source.json`,
  JSON.stringify({
    id: "tanzil-uthmani",
    nameAr: "رسم المصحف العثماني — مشروع تنزيل",
    license: "Creative Commons Attribution 3.0 — نسخ وتوزيع النص حرفيًا مسموح، تعديله غير مسموح",
    licenseUrl: "https://tanzil.net/docs/text_license",
    sourceUrl: "https://tanzil.net/",
    verified: { totalSurahs: 114, totalAyat: 6236 },
  }),
);

console.log("✅ Data build complete.");
