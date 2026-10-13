/**
 * prayerLib.ts — thin, testable wrapper around the `adhan` library
 * (local astronomical calculation, no network or external server
 * required). See README for calculation-method caveats: these are
 * mathematically standard methods, not a claim of exact agreement with
 * any specific country's official authority.
 */
import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes as AdhanPrayerTimes,
} from "adhan";

export type PrayerName = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

export const PRAYER_LABELS_AR: Record<PrayerName, string> = {
  fajr: "الفجر",
  sunrise: "الشروق",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

export const CALCULATION_METHODS = [
  "MuslimWorldLeague",
  "Egyptian",
  "Karachi",
  "UmmAlQura",
  "Dubai",
  "MoonsightingCommittee",
  "NorthAmerica",
  "Kuwait",
  "Qatar",
  "Singapore",
  "Tehran",
  "Turkey",
] as const;
export type CalculationMethodId = (typeof CALCULATION_METHODS)[number];

export const CALCULATION_METHOD_LABELS_AR: Record<CalculationMethodId, string> = {
  MuslimWorldLeague: "رابطة العالم الإسلامي",
  Egyptian: "الهيئة المصرية العامة للمساحة",
  Karachi: "جامعة العلوم الإسلامية بكراتشي",
  UmmAlQura: "جامعة أم القرى (مكة المكرمة)",
  Dubai: "دبي",
  MoonsightingCommittee: "لجنة رؤية الهلال",
  NorthAmerica: "الجمعية الإسلامية لأمريكا الشمالية (ISNA)",
  Kuwait: "الكويت",
  Qatar: "قطر",
  Singapore: "سنغافورة",
  Tehran: "طهران",
  Turkey: "تركيا (ديانت)",
};

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface NextPrayerInfo {
  name: PrayerName | null;
  time: Date | null;
  msRemaining: number | null;
}

/** Compute the six daily prayer times for a given coordinate/date/method. */
export function computePrayerTimes(
  lat: number,
  lng: number,
  date: Date,
  methodId: CalculationMethodId,
  madhab: "shafi" | "hanafi",
): PrayerTimesResult {
  const coordinates = new Coordinates(lat, lng);
  const params = CalculationMethod[methodId]();
  params.madhab = madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  const t = new AdhanPrayerTimes(coordinates, date, params);
  return {
    fajr: t.fajr,
    sunrise: t.sunrise,
    dhuhr: t.dhuhr,
    asr: t.asr,
    maghrib: t.maghrib,
    isha: t.isha,
  };
}

/** Find the next upcoming prayer (today or tomorrow's Fajr) relative to `now`. */
export function findNextPrayer(
  times: PrayerTimesResult,
  tomorrowFajr: Date,
  now: Date,
): NextPrayerInfo {
  const order: [PrayerName, Date][] = [
    ["fajr", times.fajr],
    ["sunrise", times.sunrise],
    ["dhuhr", times.dhuhr],
    ["asr", times.asr],
    ["maghrib", times.maghrib],
    ["isha", times.isha],
  ];
  for (const [name, time] of order) {
    if (time.getTime() > now.getTime()) {
      return { name, time, msRemaining: time.getTime() - now.getTime() };
    }
  }
  // all of today's prayers have passed — next is tomorrow's Fajr
  return {
    name: "fajr",
    time: tomorrowFajr,
    msRemaining: tomorrowFajr.getTime() - now.getTime(),
  };
}

export function formatRemaining(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} س ${minutes} د`;
  return `${minutes} د`;
}

export function formatClock(date: Date, timezone?: string): string {
  return new Intl.DateTimeFormat("ar", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(date);
}
