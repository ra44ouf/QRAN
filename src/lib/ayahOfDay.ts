/**
 * ayahOfDay.ts
 * -------------
 * A small curated list of well-known, self-contained ayat (not fragments
 * mid-sentence) for the home page's daily highlight. Only (surah, ayah)
 * REFERENCES are hardcoded here — the actual Quranic text always comes
 * from the verified data in public/data/quran/, never typed by hand here.
 * The pick is deterministic per calendar day (same ayah all day, changes
 * at local midnight), not random-per-visit.
 */
export const FEATURED_AYAT: [surah: number, ayah: number][] = [
  [2, 255], // آية الكرسي
  [2, 286],
  [94, 5],
  [94, 6],
  [65, 3],
  [13, 28],
  [3, 139],
  [16, 97],
  [39, 53],
  [2, 152],
  [3, 159],
  [49, 13],
  [17, 23],
  [31, 17],
  [20, 25],
  [1, 2],
  [112, 1],
  [24, 35],
  [55, 13],
  [59, 22],
];

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export function pickAyahOfDay(date: Date = new Date()): [number, number] {
  const idx = dayOfYear(date) % FEATURED_AYAT.length;
  return FEATURED_AYAT[idx]!;
}
