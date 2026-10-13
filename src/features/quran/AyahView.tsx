import { Bookmark, BookmarkCheck } from "lucide-react";
import type { Ayah } from "../../lib/types";

export function AyahView({
  ayah,
  fontSizePx,
  bookmarked,
  onToggleBookmark,
  highlightRanges,
  dark = false,
}: {
  ayah: Ayah;
  fontSizePx: number;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  highlightRanges?: [number, number][];
  /** Reading-page-only dark background is active — flip text/badge ink. */
  dark?: boolean;
}) {
  const content = highlightRanges?.length
    ? renderWithHighlights(ayah.text, highlightRanges, dark)
    : ayah.text;

  return (
    <div
      id={`ayah-${ayah.ayah}`}
      className={`group py-4 border-b last:border-b-0 scroll-mt-24 ${
        dark ? "border-white/10" : "border-divider"
      }`}
    >
      <p
        dir="rtl"
        lang="ar"
        className="leading-[2.5] text-justify"
        style={{ fontSize: fontSizePx, fontFamily: "var(--font-quran)", color: dark ? "var(--color-read-night-ink)" : undefined }}
      >
        {content}
        {/* Ayah-number circle: sized in `em` (see .ayah-badge in index.css)
            so it always scales with fontSizePx and never clips, regardless
            of digit count (1 vs. 286). */}
        <span className={`tabular-ltr ayah-badge ${dark ? "ayah-badge-night" : ""}`}>
          {ayah.ayah}
        </span>
      </p>

      {/* Per-ayah actions are intentionally minimal now: only the
          bookmark toggle stays here (it is inherently ayah-specific).
          "Listen" and "Tafsir" moved to the surah top bar — see
          SurahReaderPage — so this row no longer repeats 6,236 times. */}
      <button
        onClick={onToggleBookmark}
        aria-label={bookmarked ? "إزالة العلامة المرجعية" : "إضافة علامة مرجعية"}
        className={`mt-1 flex items-center gap-1 text-xs py-1 px-2 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity ${
          dark ? "text-brand-200 hover:bg-white/10" : "text-brand-600 hover:bg-brand-50"
        }`}
      >
        {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
        {bookmarked ? "محفوظة" : "حفظ علامة"}
      </button>
    </div>
  );
}

function renderWithHighlights(text: string, ranges: [number, number][], dark: boolean) {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  sorted.forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark
        key={i}
        className={`rounded px-0.5 ${dark ? "bg-brand-400/40 text-white" : "bg-brand-200/70 text-ink"}`}
      >
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}
