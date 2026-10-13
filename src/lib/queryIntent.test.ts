import { describe, it, expect } from "vitest";
import { detectTafsirIntent } from "./queryIntent";
import type { ChapterMeta } from "./types";

function chapter(id: number, name: string, totalVerses: number): ChapterMeta {
  return { id, name, transliteration: "", translation: "", type: "meccan", totalVerses, hasTafsir: true };
}

const chapters: ChapterMeta[] = [
  chapter(1, "الفاتحة", 7),
  chapter(2, "البقرة", 286),
  chapter(5, "المائدة", 120),
  chapter(24, "النور", 64),
  chapter(36, "يس", 83),
];

describe("detectTafsirIntent", () => {
  it("resolves a well-known ayah nickname", () => {
    const r = detectTafsirIntent("تفسير آية الكرسي", chapters);
    expect(r).toEqual({ surah: 2, ayah: 255, surahName: "البقرة", matchedVia: "nickname" });
  });

  it("resolves surah name + ayah number with Western digits", () => {
    const r = detectTafsirIntent("تفسير سورة البقرة آية 255", chapters);
    expect(r?.surah).toBe(2);
    expect(r?.ayah).toBe(255);
  });

  it("resolves surah name + ayah number with Arabic-Indic digits", () => {
    const r = detectTafsirIntent("تفسير البقرة اية ٢٥٥", chapters);
    expect(r?.surah).toBe(2);
    expect(r?.ayah).toBe(255);
  });

  it("does not fire for plain text search without the word تفسير", () => {
    expect(detectTafsirIntent("البقرة 255", chapters)).toBeNull();
    expect(detectTafsirIntent("آية الكرسي", chapters)).toBeNull();
  });

  it("does not fire for تفسير with no resolvable ayah", () => {
    expect(detectTafsirIntent("تفسير سورة البقرة", chapters)).toBeNull();
    expect(detectTafsirIntent("تفسير الرحمة", chapters)).toBeNull();
  });

  it("refuses to guess when the ayah number is out of range for the surah", () => {
    expect(detectTafsirIntent("تفسير الفاتحة آية 50", chapters)).toBeNull();
  });

  it("picks the longest/most specific matching surah name", () => {
    // "يس" is a short name that could spuriously match inside other text;
    // make sure an unrelated surah name isn't accidentally preferred.
    const r = detectTafsirIntent("تفسير سورة يس آية 1", chapters);
    expect(r?.surah).toBe(36);
  });

  it("handles empty input safely", () => {
    expect(detectTafsirIntent("", chapters)).toBeNull();
    expect(detectTafsirIntent("   ", chapters)).toBeNull();
  });

  it("returns null when chapters list is not loaded yet", () => {
    expect(detectTafsirIntent("تفسير آية الكرسي", [])).toBeNull();
  });
});
