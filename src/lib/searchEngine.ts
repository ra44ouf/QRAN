/**
 * searchEngine.ts — pure search logic, separated from the Worker's
 * message-passing plumbing so it can be unit tested directly (see
 * searchEngine.test.ts) without needing a Worker environment.
 *
 * Matching happens against `entry.n` (normalized standard-orthography
 * text). Highlighting is resolved via the build-time word alignment
 * (`entry.sOff` / `entry.uOff` / `entry.align`) rather than a naive
 * character map, because `n` is built from different wording than the
 * displayed Uthmani text `t` — see types.ts and build-data.mts.
 */
import { normalizeQuery, tokenize } from "./arabicNormalize";
import type { SearchIndexEntry, SearchResult } from "./types";

export function mergeRanges(ranges: [number, number][]): [number, number][] {
  if (ranges.length <= 1) return ranges;
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [sorted[0]!];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i]!;
    const last = merged[merged.length - 1]!;
    if (cur[0] <= last[1]) {
      last[1] = Math.max(last[1], cur[1]);
    } else {
      merged.push(cur);
    }
  }
  return merged;
}

/** Find the index of the word (in sOff) whose [start,end) range contains charIdx. */
function wordIndexAt(sOff: [number, number][], charIdx: number): number {
  for (let i = 0; i < sOff.length; i++) {
    const pair = sOff[i]!;
    if (charIdx >= pair[0] && charIdx < pair[1]) return i;
  }
  // charIdx might land exactly on a space between words; clamp to nearest
  for (let i = 0; i < sOff.length; i++) {
    if (charIdx < sOff[i]![0]) return Math.max(0, i - 1);
  }
  return sOff.length - 1;
}

/**
 * Resolve a [normStart, normEnd) match range in `entry.n` to one or more
 * highlight ranges in the original Uthmani text `entry.t`, via the
 * word-level alignment. Words with no confident alignment (-1) are simply
 * skipped — the ayah is still a correct match, just without a highlight
 * for that specific word.
 */
function resolveHighlight(
  entry: SearchIndexEntry,
  normStart: number,
  normEnd: number,
): [number, number][] {
  const firstWord = wordIndexAt(entry.sOff, normStart);
  const lastWord = wordIndexAt(entry.sOff, Math.max(normStart, normEnd - 1));
  const ranges: [number, number][] = [];
  for (let w = firstWord; w <= lastWord; w++) {
    const uIdx = entry.align[w];
    if (uIdx === undefined || uIdx === -1) continue;
    const uRange = entry.uOff[uIdx];
    if (uRange) ranges.push([uRange[0], uRange[1]]);
  }
  return ranges;
}

/**
 * Search the precomputed index. Returns ayat where either:
 *  - the full normalized query appears as a contiguous phrase (ranked first), or
 *  - every whitespace-separated token in the query appears somewhere in the
 *    ayah (AND search, order-independent) — ranked after phrase matches.
 * Both the query and an empty index are handled safely.
 */
export function searchIndex(
  index: SearchIndexEntry[],
  rawQuery: string,
  limit: number,
): SearchResult[] {
  const trimmed = rawQuery.trim();
  if (trimmed.length === 0) return [];

  const normalizedQuery = normalizeQuery(trimmed);
  const tokens = tokenize(normalizedQuery);
  if (tokens.length === 0) return [];

  const phraseMatches: SearchIndexEntry[] = [];
  const tokenMatches: SearchIndexEntry[] = [];

  for (const entry of index) {
    if (entry.n.includes(normalizedQuery)) {
      phraseMatches.push(entry);
      if (phraseMatches.length >= limit) break;
    } else if (tokens.every((t) => entry.n.includes(t))) {
      tokenMatches.push(entry);
    }
  }

  const combined = [...phraseMatches];
  for (const e of tokenMatches) {
    if (combined.length >= limit) break;
    combined.push(e);
  }

  return combined.slice(0, limit).map((entry): SearchResult => {
    let ranges: [number, number][] = [];
    const phraseIdx = entry.n.indexOf(normalizedQuery);
    if (phraseIdx !== -1) {
      ranges = resolveHighlight(entry, phraseIdx, phraseIdx + normalizedQuery.length);
    } else {
      for (const t of tokens) {
        const idx = entry.n.indexOf(t);
        if (idx !== -1) {
          ranges.push(...resolveHighlight(entry, idx, idx + t.length));
        }
      }
    }
    return {
      surah: entry.s,
      ayah: entry.a,
      text: entry.t,
      ranges: mergeRanges(ranges),
    };
  });
}
