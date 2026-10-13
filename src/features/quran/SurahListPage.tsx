import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { GlassCard } from "../../components/GlassCard";
import { LoadingState, ErrorState } from "../../components/StateViews";
import { loadChapters } from "../../lib/dataLoader";
import { useLastPosition } from "../../hooks/useLastPosition";
import type { ChapterMeta } from "../../lib/types";

export function SurahListPage() {
  const [chapters, setChapters] = useState<ChapterMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const { position } = useLastPosition();

  useEffect(() => {
    loadChapters()
      .then(setChapters)
      .catch((e: unknown) => setError(String(e)));
  }, []);

  const filtered = useMemo(() => {
    if (!chapters) return [];
    const q = filter.trim();
    if (!q) return chapters;
    return chapters.filter(
      (c) => c.name.includes(q) || c.transliteration.toLowerCase().includes(q.toLowerCase()),
    );
  }, [chapters, filter]);

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar title="القرآن الكريم" subtitle={chapters ? `${chapters.length} سورة` : undefined} />

      <div className="relative my-3">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="ابحث عن اسم سورة…"
          className="glass w-full rounded-2xl py-2.5 pr-11 pl-4 outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      {error && <ErrorState title="تعذر تحميل قائمة السور" description={error} />}
      {!chapters && !error && <LoadingState label="جارِ تحميل قائمة السور…" />}

      {chapters && (
        <GlassCard className="divide-y divide-divider overflow-hidden">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to={`/quran/${c.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50/50 transition-colors"
            >
              <span className="w-9 h-9 shrink-0 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold tabular-ltr">
                {c.id}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{c.name}</p>
                <p className="text-xs text-ink-muted">
                  {c.type === "meccan" ? "مكية" : "مدنية"} · {c.totalVerses} آية
                  {!c.hasTafsir && " · تفسير غير متوفر"}
                </p>
              </div>
              {position?.surah === c.id && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-brand-50 text-brand-600">
                  آخر قراءة
                </span>
              )}
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-ink-muted py-8">لا توجد نتائج مطابقة</p>
          )}
        </GlassCard>
      )}
    </div>
  );
}
