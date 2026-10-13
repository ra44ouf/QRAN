import { describe, it, expect } from "vitest";
import { searchIndex } from "./searchEngine";
import type { SearchIndexEntry } from "./types";
import { normalizeArabic } from "./arabicNormalize";

/**
 * In the real app, `n`/`sOff`/`uOff`/`align` are computed at build time by
 * scripts/build-data.mts (standard-orthography text aligned word-by-word
 * onto the displayed Uthmani text). This helper reproduces that for simple
 * 1:1-word-aligned test fixtures (no vocative-merge edge cases).
 */
function entry(s: number, a: number, uthmaniText: string, simpleText: string): SearchIndexEntry {
  const { normalized: n } = normalizeArabic(simpleText);
  const sWords = n.split(" ");
  const uWords = uthmaniText.split(" ");
  if (sWords.length !== uWords.length) {
    throw new Error(`Test fixture word-count mismatch for ${s}:${a}`);
  }
  const sOff: [number, number][] = [];
  let sPos = 0;
  for (const w of sWords) {
    sOff.push([sPos, sPos + w.length]);
    sPos += w.length + 1; // +1 for the space
  }
  const uOff: [number, number][] = [];
  let uPos = 0;
  for (const w of uWords) {
    uOff.push([uPos, uPos + w.length]);
    uPos += w.length + 1;
  }
  const align = sWords.map((_, i) => i);
  return { s, a, t: uthmaniText, n, sOff, uOff, align };
}

const sample: SearchIndexEntry[] = [
  entry(1, 1, "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "بسم الله الرحمن الرحيم"),
  entry(1, 2, "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ", "الحمد لله رب العالمين"),
  entry(1, 3, "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "الرحمن الرحيم"),
  entry(2, 1, "الٓمٓ", "الم"),
  entry(2, 255, "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ", "الله لا إله إلا هو الحي القيوم"),
];

describe("searchIndex", () => {
  it("finds ayat by unvocalized query, returns fully vocalized text", () => {
    const results = searchIndex(sample, "الرحمن الرحيم", 10);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.text).toMatch(/[\u064B-\u065F]/); // still contains tashkeel
    }
  });

  it("finds ayat even when query itself has tashkeel", () => {
    const results = searchIndex(sample, "الرَّحْمَٰن", 10);
    expect(results.some((r) => r.surah === 1 && r.ayah === 1)).toBe(true);
  });

  it("handles empty queries safely", () => {
    expect(searchIndex(sample, "", 10)).toEqual([]);
    expect(searchIndex(sample, "   ", 10)).toEqual([]);
  });

  it("handles short queries without throwing", () => {
    expect(() => searchIndex(sample, "ا", 10)).not.toThrow();
  });

  it("returns no results for words that do not exist in the Quran", () => {
    const results = searchIndex(sample, "كمبيوتر", 10);
    expect(results).toEqual([]);
  });

  it("supports multi-word AND search independent of word order in-text", () => {
    const results = searchIndex(sample, "العالمين الحمد", 10);
    expect(results.some((r) => r.surah === 1 && r.ayah === 2)).toBe(true);
  });

  it("does not duplicate the same ayah in results", () => {
    const results = searchIndex(sample, "الرحيم", 10);
    const keys = results.map((r) => `${r.surah}:${r.ayah}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("respects the limit parameter", () => {
    const results = searchIndex(sample, "الله", 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it("produces highlight ranges that point at the correct word in the original text", () => {
    const results = searchIndex(sample, "الحمد", 10);
    const hit = results.find((r) => r.surah === 1 && r.ayah === 2);
    expect(hit).toBeTruthy();
    expect(hit!.ranges.length).toBeGreaterThan(0);
    const [start, end] = hit!.ranges[0]!;
    const substring = hit!.text.slice(start, end);
    // The highlighted original-text word should normalize back to the query.
    expect(normalizeArabic(substring).normalized).toBe("الحمد");
  });

  it("highlights both words of a two-word phrase match", () => {
    const results = searchIndex(sample, "الرحمن الرحيم", 10);
    const hit = results.find((r) => r.surah === 1 && r.ayah === 3);
    expect(hit).toBeTruthy();
    expect(hit!.ranges.length).toBe(2);
  });

  it("does not crash when a word has no alignment (-1)", () => {
    const withGap: SearchIndexEntry = {
      ...sample[1]!,
      align: sample[1]!.align.map((v, i) => (i === 3 ? -1 : v)), // drop العالمين's alignment
    };
    const results = searchIndex([withGap], "العالمين", 10);
    expect(results.length).toBe(1);
    expect(results[0]!.ranges.length).toBe(0); // correct match, but no highlight
  });

  it("measures search time is fast for a larger synthetic index", () => {
    const big: SearchIndexEntry[] = [];
    for (let i = 0; i < 6236; i++) {
      big.push(entry(1, i, "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ", "الحمد لله رب العالمين"));
    }
    const start = performance.now();
    searchIndex(big, "الحمد لله", 50);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
