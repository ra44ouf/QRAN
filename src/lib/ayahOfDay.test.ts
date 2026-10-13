import { describe, it, expect } from "vitest";
import { pickAyahOfDay, FEATURED_AYAT } from "./ayahOfDay";

describe("pickAyahOfDay", () => {
  it("is deterministic for the same calendar day", () => {
    const a = pickAyahOfDay(new Date("2026-03-15T08:00:00"));
    const b = pickAyahOfDay(new Date("2026-03-15T22:00:00"));
    expect(a).toEqual(b);
  });

  it("always returns a reference from the curated list", () => {
    for (let i = 0; i < 30; i++) {
      const date = new Date(2026, 0, 1 + i);
      const [surah, ayah] = pickAyahOfDay(date);
      expect(FEATURED_AYAT).toContainEqual([surah, ayah]);
    }
  });

  it("changes across different days (not stuck on one value)", () => {
    const picks = new Set<string>();
    for (let i = 0; i < FEATURED_AYAT.length; i++) {
      const date = new Date(2026, 0, 1 + i);
      picks.add(pickAyahOfDay(date).join(":"));
    }
    expect(picks.size).toBeGreaterThan(1);
  });
});
