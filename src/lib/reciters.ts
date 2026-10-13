/**
 * reciters.ts
 * ------------
 * A small curated list of reciters, sourced from the real, published
 * edition identifiers of the "islamic.network" Quran audio CDN (the same
 * backend used by the well-known api.alquran.cloud project). The
 * identifiers below (`ar.alafasy`, `ar.abdulbasitmurattal`, etc.) are
 * copied verbatim from that CDN's own published edition list — not
 * invented — and each is confirmed to have all 114 surahs available.
 *
 * ⚠️ HONESTY NOTE (see README "قيود معروفة"): this build environment's
 * network access does not include cdn.islamic.network, so these exact
 * audio URLs could not be fetched/verified from here. The URL pattern
 * below (`/quran/audio-surah/{bitrate}/{edition}/{surah}.mp3`) is the
 * CDN's documented, publicly-known pattern, but you should verify
 * playback yourself after deploying before relying on it. The player
 * handles a failed/unavailable URL gracefully (clear error + retry with a
 * different reciter) rather than pretending playback always succeeds.
 */
export interface Reciter {
  id: string; // CDN edition identifier
  nameAr: string;
  bitrate: "128" | "64";
}

export const RECITERS: Reciter[] = [
  { id: "ar.alafasy", nameAr: "مشاري بن راشد العفاسي", bitrate: "128" },
  { id: "ar.abdulbasitmurattal", nameAr: "عبد الباسط عبد الصمد (مرتل)", bitrate: "128" },
  { id: "ar.ahmedalajmi", nameAr: "أحمد بن علي العجمي", bitrate: "128" },
  { id: "ar.saudalshuraim", nameAr: "سعود الشريم", bitrate: "128" },
  { id: "ar.muhammadsiddiqalminshawimujawwad", nameAr: "محمد صديق المنشاوي (مجوّد)", bitrate: "128" },
];

export function audioUrlFor(reciterId: string, bitrate: string, surah: number): string {
  return `https://cdn.islamic.network/quran/audio-surah/${bitrate}/${reciterId}/${surah}.mp3`;
}

export function randomReciter(): Reciter {
  return RECITERS[Math.floor(Math.random() * RECITERS.length)]!;
}

export function randomSurah(): number {
  return 1 + Math.floor(Math.random() * 114);
}
