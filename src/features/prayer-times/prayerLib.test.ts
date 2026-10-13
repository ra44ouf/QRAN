import { describe, it, expect } from "vitest";
import { computePrayerTimes, findNextPrayer, formatRemaining } from "./prayerLib";

describe("computePrayerTimes", () => {
  it("returns six prayer times in chronological order for Makkah", () => {
    const date = new Date("2026-06-15T00:00:00Z");
    const times = computePrayerTimes(21.4225, 39.8262, date, "UmmAlQura", "shafi");
    expect(times.fajr.getTime()).toBeLessThan(times.sunrise.getTime());
    expect(times.sunrise.getTime()).toBeLessThan(times.dhuhr.getTime());
    expect(times.dhuhr.getTime()).toBeLessThan(times.asr.getTime());
    expect(times.asr.getTime()).toBeLessThan(times.maghrib.getTime());
    expect(times.maghrib.getTime()).toBeLessThan(times.isha.getTime());
  });

  it("produces different Asr times for shafi vs hanafi madhab (shadow length differs)", () => {
    const date = new Date("2026-06-15T00:00:00Z");
    const shafi = computePrayerTimes(24.7136, 46.6753, date, "UmmAlQura", "shafi");
    const hanafi = computePrayerTimes(24.7136, 46.6753, date, "UmmAlQura", "hanafi");
    expect(hanafi.asr.getTime()).toBeGreaterThan(shafi.asr.getTime());
  });

  it("gives plausible results for a high-latitude city without throwing", () => {
    const date = new Date("2026-06-15T00:00:00Z");
    expect(() => computePrayerTimes(51.5072, -0.1276, date, "MuslimWorldLeague", "shafi")).not.toThrow();
  });
});

describe("findNextPrayer", () => {
  it("picks the next prayer later today when one remains", () => {
    const date = new Date("2026-06-15T00:00:00Z");
    const times = computePrayerTimes(21.4225, 39.8262, date, "UmmAlQura", "shafi");
    const justBeforeMaghrib = new Date(times.maghrib.getTime() - 5 * 60_000);
    const result = findNextPrayer(times, times.fajr, justBeforeMaghrib);
    expect(result.name).toBe("maghrib");
    expect(result.msRemaining).toBeCloseTo(5 * 60_000, -2);
  });

  it("rolls over to tomorrow's Fajr when all of today's prayers have passed", () => {
    const date = new Date("2026-06-15T00:00:00Z");
    const times = computePrayerTimes(21.4225, 39.8262, date, "UmmAlQura", "shafi");
    const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowTimes = computePrayerTimes(21.4225, 39.8262, tomorrow, "UmmAlQura", "shafi");
    const afterIsha = new Date(times.isha.getTime() + 60 * 60_000);
    const result = findNextPrayer(times, tomorrowTimes.fajr, afterIsha);
    expect(result.name).toBe("fajr");
    expect(result.time?.getTime()).toBe(tomorrowTimes.fajr.getTime());
  });
});

describe("formatRemaining", () => {
  it("formats minutes-only durations", () => {
    expect(formatRemaining(45 * 60_000)).toBe("45 د");
  });
  it("formats hour+minute durations", () => {
    expect(formatRemaining(90 * 60_000)).toBe("1 س 30 د");
  });
  it("clamps negative durations to zero rather than showing negative time", () => {
    expect(formatRemaining(-1000)).toBe("0 د");
  });
});
