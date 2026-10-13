import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ChevronRight, ChevronLeft, BookOpenText } from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { LoadingState, ErrorState } from "../../components/StateViews";
import { AyahView } from "./AyahView";
import { ReaderToolbar, backgroundStyle, isDarkBackground } from "./ReaderToolbar";
import { SurahListenControl } from "./SurahListenControl";
import { loadChapters, loadSurah } from "../../lib/dataLoader";
import { getReaderSettings, setReaderSettings } from "../../lib/settings";
import { useBookmarks } from "../../hooks/useBookmarks";
import { useLastPosition } from "../../hooks/useLastPosition";
import type { Ayah, ChapterMeta, ReaderSettings as ReaderSettingsT } from "../../lib/types";

const AYAT_PER_PAGE = 10;

export function SurahReaderPage() {
  const { surahId } = useParams();
  const [searchParams] = useSearchParams();
  const targetAyah = Number(searchParams.get("ayah") ?? "0") || null;

  const id = Number(surahId);
  const [chapters, setChapters] = useState<ChapterMeta[] | null>(null);
  const [ayat, setAyat] = useState<Ayah[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ReaderSettingsT>(() => getReaderSettings());
  const [pageIndex, setPageIndex] = useState(0);
  // The ayah currently in view — drives both last-position saving and the
  // top-bar "Tafsir" quick-access button's target (spec change: Tafsir
  // moved from repeating under every ayah to one button in the top bar).
  const [currentAyah, setCurrentAyah] = useState<number>(targetAyah ?? 1);

  const { isBookmarked, toggle } = useBookmarks();
  const { save } = useLastPosition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChapters()
      .then(setChapters)
      .catch((e: unknown) => setError(String(e)));
  }, []);

  useEffect(() => {
    setAyat(null);
    setError(null);
    if (!Number.isFinite(id) || id < 1 || id > 114) {
      setError("رقم سورة غير صحيح");
      return;
    }
    loadSurah(id)
      .then(setAyat)
      .catch((e: unknown) => setError(String(e)));
  }, [id]);

  const chapter = chapters?.find((c) => c.id === id);
  const dark = isDarkBackground(settings.background);

  const pages = useMemo(() => {
    if (!ayat) return [];
    const chunks: Ayah[][] = [];
    for (let i = 0; i < ayat.length; i += AYAT_PER_PAGE) {
      chunks.push(ayat.slice(i, i + AYAT_PER_PAGE));
    }
    return chunks;
  }, [ayat]);

  // Jump to target ayah (from search/last-position) once data is ready
  useEffect(() => {
    if (!ayat || !targetAyah) return;
    if (settings.mode === "paged") {
      const idx = pages.findIndex((p) => p.some((a) => a.ayah === targetAyah));
      if (idx >= 0) setPageIndex(idx);
    } else {
      requestAnimationFrame(() => {
        document.getElementById(`ayah-${targetAyah}`)?.scrollIntoView({ block: "center" });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayat, targetAyah]);

  function updateSettings(next: ReaderSettingsT) {
    setSettings(next);
    setReaderSettings(next);
  }

  // Track reading position: scroll mode uses IntersectionObserver on the
  // first visible ayah; paged mode saves on page change.
  useEffect(() => {
    if (settings.mode !== "scroll" || !ayat || !containerRef.current) return;
    const els = Array.from(containerRef.current.querySelectorAll<HTMLElement>("[id^='ayah-']"));
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
        )[0]!;
        const ayahNum = Number(topMost.target.id.replace("ayah-", ""));
        if (ayahNum) {
          void save(id, ayahNum);
          setCurrentAyah(ayahNum);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ayat, settings.mode, id, save]);

  useEffect(() => {
    if (settings.mode === "paged" && pages[pageIndex]?.[0]) {
      void save(id, pages[pageIndex][0].ayah);
      setCurrentAyah(pages[pageIndex][0].ayah);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, settings.mode, pages]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <TopBar title="خطأ" onBack />
        <ErrorState title="تعذر فتح السورة" description={error} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar
        title={chapter ? `سورة ${chapter.name}` : "جارِ التحميل…"}
        subtitle={chapter ? `${chapter.type === "meccan" ? "مكية" : "مدنية"} · ${chapter.totalVerses} آية` : undefined}
        onBack
        action={
          <div className="flex items-center gap-1.5">
            {chapter?.hasTafsir !== false && (
              <Link
                to={`/tafsir/${id}/${currentAyah}`}
                aria-label="التفسير"
                title="التفسير"
                className="glass-btn w-9 h-9 rounded-full flex items-center justify-center text-ink-muted"
              >
                <BookOpenText size={17} />
              </Link>
            )}
            <SurahListenControl surah={id} surahName={chapter?.name ?? ""} />
            <SurahNavButtons id={id} chapters={chapters} />
          </div>
        }
      />

      <div className="my-3">
        <ReaderToolbar settings={settings} onChange={updateSettings} />
      </div>

      {!ayat && <LoadingState label="جارِ تحميل السورة…" />}

      {ayat && (
        <>
          <div
            ref={containerRef}
            className="rounded-3xl overflow-hidden px-4 transition-colors"
            style={backgroundStyle(settings.background)}
          >
            {settings.mode === "scroll" &&
              ayat.map((a) => (
                <AyahView
                  key={a.ayah}
                  ayah={a}
                  fontSizePx={settings.fontSizePx}
                  bookmarked={isBookmarked(a.surah, a.ayah)}
                  onToggleBookmark={() => void toggle(a.surah, a.ayah, chapter?.name ?? "")}
                  dark={dark}
                />
              ))}

            {settings.mode === "paged" &&
              pages[pageIndex] &&
              pages[pageIndex].map((a) => (
                <AyahView
                  key={a.ayah}
                  ayah={a}
                  fontSizePx={settings.fontSizePx}
                  bookmarked={isBookmarked(a.surah, a.ayah)}
                  onToggleBookmark={() => void toggle(a.surah, a.ayah, chapter?.name ?? "")}
                  dark={dark}
                />
              ))}
          </div>

          {settings.mode === "paged" && pages[pageIndex] && (
            <>
              <div className="flex items-center justify-between py-4">
                <button
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  className="glass-btn flex items-center gap-1 px-4 py-2 rounded-full text-brand-600 disabled:opacity-30"
                >
                  <ChevronRight size={16} /> السابقة
                </button>
                <span className="text-xs text-ink-muted tabular-ltr">
                  {pageIndex + 1} / {pages.length}
                </span>
                <button
                  disabled={pageIndex >= pages.length - 1}
                  onClick={() => setPageIndex((p) => Math.min(pages.length - 1, p + 1))}
                  className="glass-btn flex items-center gap-1 px-4 py-2 rounded-full text-brand-600 disabled:opacity-30"
                >
                  التالية <ChevronLeft size={16} />
                </button>
              </div>
              <p className="text-center text-[11px] text-ink-muted pb-3">
                ترقيم الصفحات هنا لتسهيل القراءة داخل التطبيق فقط، ولا يطابق ترقيم صفحات المصحف
                المطبوع الرسمي.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

function SurahNavButtons({ id, chapters }: { id: number; chapters: ChapterMeta[] | null }) {
  if (!chapters) return null;
  const prev = chapters.find((c) => c.id === id - 1);
  const next = chapters.find((c) => c.id === id + 1);
  return (
    <div className="flex items-center gap-1">
      {prev && (
        <Link
          to={`/quran/${prev.id}`}
          aria-label={`السورة السابقة: ${prev.name}`}
          className="glass-btn p-2 rounded-full text-brand-600"
        >
          <ChevronRight size={18} />
        </Link>
      )}
      {next && (
        <Link
          to={`/quran/${next.id}`}
          aria-label={`السورة التالية: ${next.name}`}
          className="glass-btn p-2 rounded-full text-brand-600"
        >
          <ChevronLeft size={18} />
        </Link>
      )}
    </div>
  );
}
