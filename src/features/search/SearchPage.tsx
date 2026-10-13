import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, BookOpenText, Navigation } from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { GlassCard } from "../../components/GlassCard";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { useQuranSearch } from "../../hooks/useQuranSearch";
import { loadChapters } from "../../lib/dataLoader";
import { detectTafsirIntent } from "../../lib/queryIntent";
import type { ChapterMeta } from "../../lib/types";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get("q") ?? "";
  const [input, setInput] = useState(initialQuery);
  const { status, results, search, isSearching, indexSize, errorMessage, elapsedMs } =
    useQuranSearch();
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadChapters().then(setChapters);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // search as-you-type once the index is ready
  useEffect(() => {
    if (status === "ready") search(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, status]);

  function onChange(v: string) {
    setInput(v);
    setParams(v ? { q: v } : {}, { replace: true });
  }

  function chapterName(surah: number) {
    return chapters.find((c) => c.id === surah)?.name ?? surah;
  }

  // "تفسير آية الكرسي" / "تفسير سورة البقرة آية 255" etc. — someone asking
  // for a specific ayah's tafsir wants that location directly, not a text
  // search; surface it as a direct-navigation card above normal results.
  const tafsirIntent = useMemo(() => detectTafsirIntent(input, chapters), [input, chapters]);

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar title="البحث في القرآن" subtitle={status === "ready" ? `${indexSize} آية مفهرسة` : undefined} />

      <div className="relative my-3">
        <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => onChange(e.target.value)}
          placeholder="اكتب بدون تشكيل، مثال: الرحمن الرحيم"
          dir="rtl"
          className="glass w-full rounded-2xl py-3 pr-11 pl-4 outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      {status === "loading-index" && <LoadingState label="جارِ تجهيز فهرس البحث…" />}
      {status === "error" && (
        <ErrorState title="تعذر تشغيل محرك البحث" description={errorMessage ?? undefined} />
      )}

      {status === "ready" && input.trim() === "" && (
        <EmptyState
          title="ابحث في القرآن الكريم"
          description="يعمل البحث محليًا دون إنترنت، ويتجاهل التشكيل تلقائيًا."
          icon={<SearchIcon size={32} />}
        />
      )}

      {status === "ready" && tafsirIntent && (
        <Link to={`/tafsir/${tafsirIntent.surah}/${tafsirIntent.ayah}`}>
          <GlassCard className="p-4 mb-3 flex items-center gap-3 ring-2 ring-brand-300 bg-gradient-to-br from-brand-50 to-transparent">
            <div className="w-11 h-11 rounded-2xl bg-brand-500 flex items-center justify-center shrink-0 text-white">
              <Navigation size={19} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-brand-600 font-semibold">نتيجة مباشرة</p>
              <p className="font-bold text-sm">
                تفسير سورة {tafsirIntent.surahName} — آية {tafsirIntent.ayah}
              </p>
            </div>
            <BookOpenText className="text-brand-500 shrink-0" size={20} />
          </GlassCard>
        </Link>
      )}

      {status === "ready" && input.trim() !== "" && results.length === 0 && !isSearching && !tafsirIntent && (
        <EmptyState title="لا توجد نتائج" description={`لم يتم العثور على "${input}" في القرآن الكريم`} />
      )}

      {status === "ready" && results.length > 0 && (
        <>
          {elapsedMs !== null && (
            <p className="text-[11px] text-ink-muted mb-2 tabular-ltr">
              {results.length} نتيجة · {elapsedMs.toFixed(1)}ms
            </p>
          )}
          <div className="space-y-2">
            {results.map((r) => (
              <GlassCard key={`${r.surah}:${r.ayah}`} className="p-4">
                <p
                  dir="rtl"
                  lang="ar"
                  className="leading-[2.2] text-lg"
                  style={{ fontFamily: "var(--font-quran)" }}
                >
                  {renderHighlighted(r.text, r.ranges)}
                </p>
                <div className="flex items-center justify-between mt-2.5 text-xs text-ink-muted">
                  <span>
                    سورة {chapterName(r.surah)} — آية {r.ayah}
                  </span>
                  <div className="flex gap-1.5">
                    <Link
                      to={`/quran/${r.surah}?ayah=${r.ayah}`}
                      className="glass-btn px-2.5 py-1 rounded-full text-brand-600 font-semibold"
                    >
                      فتح في المصحف
                    </Link>
                    <Link
                      to={`/tafsir/${r.surah}/${r.ayah}`}
                      className="glass-btn px-2.5 py-1 rounded-full text-brand-600 font-semibold flex items-center gap-1"
                    >
                      <BookOpenText size={13} /> التفسير
                    </Link>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function renderHighlighted(text: string, ranges: [number, number][]) {
  if (!ranges.length) return text;
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  sorted.forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={i} className="bg-brand-200/70 text-ink rounded px-0.5">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}
