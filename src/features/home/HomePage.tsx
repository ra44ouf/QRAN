import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Search,
  Clock,
  Moon,
  Bookmark as BookmarkIcon,
  Settings as SettingsIcon,
  ChevronLeft,
} from "lucide-react";
import { OfflineBanner } from "../../components/StateViews";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useLastPosition } from "../../hooks/useLastPosition";
import { useBookmarks } from "../../hooks/useBookmarks";
import { loadChapters, loadSurah } from "../../lib/dataLoader";
import { pickAyahOfDay } from "../../lib/ayahOfDay";
import type { Ayah, ChapterMeta } from "../../lib/types";

const QUICK_LINKS = [
  { to: "/quran", label: "القرآن الكريم", icon: BookOpen, tint: "home-shortcut-quran", iconColor: "text-sky-600" },
  { to: "/prayer-times", label: "مواقيت الصلاة", icon: Clock, tint: "home-shortcut-prayer", iconColor: "text-teal-500" },
  { to: "/relaxation", label: "وضع الراحة", icon: Moon, tint: "home-shortcut-relax", iconColor: "text-violet-600" },
  { to: "/settings", label: "الإعدادات", icon: SettingsIcon, tint: "home-shortcut-settings", iconColor: "text-amber-500" },
];

export function HomePage() {
  const online = useOnlineStatus();
  const navigate = useNavigate();
  const { position } = useLastPosition();
  const { bookmarks } = useBookmarks();
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState<{ ayah: Ayah; surahName: string } | null>(null);

  useEffect(() => {
    void loadChapters().then(setChapters);
  }, []);

  useEffect(() => {
    const [surah, ayahNum] = pickAyahOfDay();
    void loadSurah(surah).then((ayat) => {
      const found = ayat.find((a) => a.ayah === ayahNum) ?? ayat[0];
      void loadChapters().then((cs) => {
        const name = cs.find((c) => c.id === surah)?.name ?? "";
        if (found) setFeatured({ ayah: found, surahName: name });
      });
    });
  }, []);

  const lastChapter = chapters.find((c) => c.id === position?.surah);
  const continueChapter = lastChapter ?? chapters.find((c) => c.id === 2);
  const continueAyah = position?.ayah ?? 1;

  function goToSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    else navigate("/search");
  }

  return (
    <div className="home-page max-w-2xl mx-auto">
      <OfflineBanner online={online} />

      <header className="home-hero">
        <div className="home-brand" aria-label="قُرآن Quran">
          <h1>قُرآن</h1>
          <p className="home-brand-english">Q U R A N</p>
          <p className="home-tagline">قراءة، بحث، تفسير، ومواقيت صلاة — دون إنترنت</p>
        </div>
      </header>

      <form onSubmit={goToSearch} className="home-search">
        <Search aria-hidden="true" className="home-search-icon" size={21} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في القرآن ... (مثال: الرحمن الرحيم)"
          aria-label="ابحث في القرآن الكريم"
        />
      </form>

      {featured && (
        <section className="home-featured home-surface" aria-labelledby="ayah-of-day-title">
          <div className="home-featured-heading">
            <span id="ayah-of-day-title">آية اليوم</span>
          </div>
          <p dir="rtl" lang="ar" className="home-featured-ayah">
            {featured.ayah.text}
          </p>
          <div className="home-featured-footer">
            <span className="home-featured-source">
              سورة {featured.surahName} — آية {featured.ayah.ayah}
            </span>
            <Link to={`/quran/${featured.ayah.surah}?ayah=${featured.ayah.ayah}`} className="home-featured-link">
              <ChevronLeft size={17} />
              فتح في المصحف
            </Link>
          </div>
        </section>
      )}

      {continueChapter && (
        <Link to={`/quran/${continueChapter.id}?ayah=${continueAyah}`} className="home-continue home-surface">
          <span className="home-continue-icon"><BookOpen size={26} /></span>
          <span className="home-continue-copy">
            <span className="home-continue-label">{position ? "متابعة القراءة" : "ابدأ القراءة"}</span>
            <span className="home-continue-title">سورة {continueChapter.name} — آية {continueAyah}</span>
          </span>
          <ChevronLeft className="home-continue-arrow" size={22} />
        </Link>
      )}

      <nav className="home-shortcuts" aria-label="اختصارات التطبيق">
        {QUICK_LINKS.map(({ to, label, icon: Icon, tint, iconColor }) => (
          <Link key={to} to={to} className="home-shortcut">
            <span className={`home-shortcut-icon ${tint}`}>
              <Icon className={iconColor} size={29} strokeWidth={1.8} />
            </span>
            <span className="home-shortcut-label">{label}</span>
          </Link>
        ))}
      </nav>

      <Link to="/settings" className="home-bookmarks home-surface">
        <span className="home-bookmarks-main">
          <span className="home-bookmarks-icon"><BookmarkIcon size={27} /></span>
          <span className="home-bookmarks-title">العلامات المرجعية المحفوظة</span>
        </span>
        <span className="home-bookmarks-count">
          <span className="tabular-ltr">{bookmarks.length}</span>
          <ChevronLeft size={21} />
        </span>
      </Link>
    </div>
  );
}
