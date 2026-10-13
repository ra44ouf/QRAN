import { describe, it, expect } from "vitest";
import { normalizeArabic, normalizeQuery, tokenize } from "./arabicNormalize";

describe("normalizeArabic", () => {
  it("removes full diacritics (tashkeel) from a fully-vocalized ayah", () => {
    const original = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    const { normalized } = normalizeArabic(original);
    expect(normalized).toBe("بسم الله الرحمن الرحيم");
  });

  it("does not alter the original string (purity / no mutation)", () => {
    const original = "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ";
    const copy = original.slice();
    normalizeArabic(original);
    expect(original).toBe(copy);
  });

  it("unifies all Alef forms to bare Alef", () => {
    expect(normalizeQuery("أحمد إبراهيم آدم ٱلرحمن")).toBe("احمد ابراهيم ادم الرحمن");
  });

  it("unifies Alef Maksura with Yeh", () => {
    expect(normalizeQuery("موسى عيسى")).toBe("موسي عيسي");
  });

  it("unifies Teh Marbuta with Heh", () => {
    expect(normalizeQuery("رحمة الجنة")).toBe("رحمه الجنه");
  });

  it("removes tatweel (kashida)", () => {
    expect(normalizeQuery("الـــرحمـــن")).toBe("الرحمن");
  });

  it("handles empty and whitespace-only input safely", () => {
    expect(normalizeQuery("")).toBe("");
    expect(normalizeQuery("   ")).toBe("   ");
    expect(tokenize(normalizeQuery("   "))).toEqual([]);
  });

  it("matches 'الرحمن الرحيم' search against fully vocalized ayah text", () => {
    const ayah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    const query = "الرحمن الرحيم";
    const { normalized } = normalizeArabic(ayah);
    expect(normalized.includes(normalizeQuery(query))).toBe(true);
  });

  it("does not create misleading matches by over-normalizing distinct words", () => {
    // "كتب" (wrote) vs "كتاب" (book) must remain distinguishable even
    // after normalization — we must not strip consonants.
    const a = normalizeQuery("كتب");
    const b = normalizeQuery("كتاب");
    expect(a).not.toBe(b);
  });

  it("produces an index map that points back to the original string", () => {
    const original = "قَالَ"; // ق(0) َ(1) ا(2) ل(3) َ(4)
    const { normalized, map } = normalizeArabic(original);
    expect(normalized).toBe("قال");
    // normalized[0] 'ق' came from original[0]
    expect(map[0]).toBe(0);
    // normalized[1] 'ا' came from original[2]
    expect(map[1]).toBe(2);
    // normalized[2] 'ل' came from original[3]
    expect(map[2]).toBe(3);
  });

  it("strips the Quranic dagger alif (ٰ) as a diacritic rather than guessing its value", () => {
    // Whether the dagger alif corresponds to a written alef in standard
    // spelling is lexical (العالمين has one, الرحمن doesn't) — not
    // decidable from the character alone, so we strip it like any other
    // diacritic. The app's search index is built from standard-orthography
    // text instead of relying on this function to parse Uthmani rasm
    // quirks — see scripts/build-data.mts.
    expect(normalizeQuery("ٱلْعَٰلَمِينَ")).toBe("العلمين");
    expect(normalizeQuery("ٱلرَّحْمَٰنِ")).toBe("الرحمن");
  });

  it("tokenizes multi-word queries on whitespace", () => {
    expect(tokenize(normalizeQuery("الحمد لله رب العالمين"))).toEqual([
      "الحمد",
      "لله",
      "رب",
      "العالمين",
    ]);
  });
});
