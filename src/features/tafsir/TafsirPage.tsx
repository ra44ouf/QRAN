import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, BookOpen } from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { GlassCard } from "../../components/GlassCard";
import { LoadingState, ErrorState, EmptyState } from "../../components/StateViews";
import { loadChapters, loadSurah, loadTafsirForSurah, loadTafsirSourceMeta } from "../../lib/dataLoader";
import type { Ayah, ChapterMeta, TafsirEntry } from "../../lib/types";

export function TafsirPage() {
  const { surahId, ayahId } = useParams();
  const navigate = useNavigate();
  const surah = Number(surahId);
  const ayahNum = Number(ayahId);

  const [chapter, setChapter] = useState<ChapterMeta | null>(null);
  const [ayat, setAyat] = useState<Ayah[] | null>(null);
  const [tafsir, setTafsir] = useState<TafsirEntry[] | null>(null);
  const [sourceName, setSourceName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    Promise.all([loadChapters(), loadSurah(surah), loadTafsirSourceMeta()])
      .then(([chapters, ayatList, source]) => {
        setChapter(chapters.find((c) => c.id === surah) ?? null);
        setAyat(ayatList);
        setSourceName(source.nameAr);
      })
      .catch((e: unknown) => setError(String(e)));

    loadTafsirForSurah(surah)
      .then(setTafsir)
      .catch(() => setTafsir([])); // handled as "no tafsir" below, not a hard error
  }, [surah]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <TopBar title="خطأ" onBack />
        <ErrorState title="تعذر تحميل التفسير" description={error} />
      </div>
    );
  }

  if (!ayat || !chapter) return <LoadingState label="جارِ التحميل…" />;

  const currentAyah = ayat.find((a) => a.ayah === ayahNum);
  const currentTafsir = tafsir?.find((t) => t.ayah === ayahNum);
  const hasPrev = ayahNum > 1;
  const hasNext = ayahNum < chapter.totalVerses;

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar
        title={`تفسير سورة ${chapter.name}`}
        subtitle={sourceName ? `المصدر: ${sourceName}` : undefined}
        onBack
      />

      <div className="flex items-center justify-between my-3">
        <button
          disabled={!hasPrev}
          onClick={() => navigate(`/tafsir/${surah}/${ayahNum - 1}`)}
          className="glass-btn flex items-center gap-1 px-3 py-1.5 rounded-full text-brand-600 text-sm disabled:opacity-30"
        >
          <ChevronRight size={15} /> الآية السابقة
        </button>
        <span className="text-xs text-ink-muted tabular-ltr">
          {ayahNum} / {chapter.totalVerses}
        </span>
        <button
          disabled={!hasNext}
          onClick={() => navigate(`/tafsir/${surah}/${ayahNum + 1}`)}
          className="glass-btn flex items-center gap-1 px-3 py-1.5 rounded-full text-brand-600 text-sm disabled:opacity-30"
        >
          الآية التالية <ChevronLeft size={15} />
        </button>
      </div>

      {currentAyah ? (
        <GlassCard className="p-5 mb-3">
          <p
            dir="rtl"
            lang="ar"
            className="text-xl leading-[2.3] text-center"
            style={{ fontFamily: "var(--font-quran)" }}
          >
            {currentAyah.text}
          </p>
          <Link
            to={`/quran/${surah}?ayah=${ayahNum}`}
            className="flex items-center justify-center gap-1 mt-3 text-sm text-brand-600 font-semibold"
          >
            <BookOpen size={15} /> فتح في المصحف
          </Link>
        </GlassCard>
      ) : (
        <ErrorState title="رقم آية غير صحيح" />
      )}

      {tafsir === null && <LoadingState label="جارِ تحميل التفسير…" />}

      {tafsir !== null && !currentTafsir && (
        <EmptyState
          title="التفسير غير متوفر لهذه الآية"
          description="لم يتم توفير بيانات تفسير موثوقة لهذه الآية ضمن هذا الإصدار من التطبيق، بدل اختلاق نص غير موثق."
        />
      )}

      {currentTafsir && (
        <GlassCard className="p-5">
          <p className="leading-[2] text-ink">{currentTafsir.text}</p>
        </GlassCard>
      )}
    </div>
  );
}
