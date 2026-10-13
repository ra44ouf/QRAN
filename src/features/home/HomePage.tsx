import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Search, Clock, Moon, Bookmark as BookmarkIcon, Settings as SettingsIcon } from "lucide-react";
import { GlassCard } from "../../components/GlassCard";
import { OfflineBanner } from "../../components/StateViews";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useLastPosition } from "../../hooks/useLastPosition";
import { useBookmarks } from "../../hooks/useBookmarks";
import { loadChapters, loadSurah } from "../../lib/dataLoader";
import { pickAyahOfDay } from "../../lib/ayahOfDay";
import type { Ayah, ChapterMeta } from "../../lib/types";

const QUICK_LINKS = [
  { to: "/quran", label: "القرآن الكريم", icon: BookOpen, tint: "from-sky-400/25 to-sky-500/10", iconColor: "text-sky-600" },
  { to: "/prayer-times", label: "مواقيت الصلاة", icon: Clock, tint: "from-teal-400/25 to-teal-500/10", iconColor: "text-teal-600" },
  { to: "/relaxation", label: "وضع الراحة", icon: Moon, tint: "from-violet-400/25 to-violet-500/10", iconColor: "text-violet-600" },
  { to: "/settings", label: "الإعدادات", icon: SettingsIcon, tint: "from-amber-400/25 to-amber-500/10", iconColor: "text-amber-600" },
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

  function goToSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    else navigate("/search");
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <OfflineBanner online={online} />

      {/* Hero */}
      <GlassCard className="p-6 text-center overflow-hidden relative">
        <div className="relative">
          <h1 className="text-3xl font-bold text-brand-600 tracking-tight">قُرآن</h1>
          <p className="text-xs text-ink-muted mt-1 tracking-[0.2em] uppercase">QURAN</p>
          <p className="text-sm text-ink-muted mt-3">قراءة، بحث، تفسير، ومواقيت صلاة — دون إنترنت</p>

          <form onSubmit={goToSearch} className="relative mt-4">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في القرآن… (مثال: الرحمن الرحيم)"
              className="glass-btn w-full rounded-2xl py-3 pr-11 pl-4 outline-none focus:ring-2 focus:ring-brand-400 text-sm"
            />
          </form>
        </div>
      </GlassCard>

      {/* Ayah of the day */}
      {featured && (
        <GlassCard className="p-5">
          <p className="text-[11px] text-brand-500 font-semibold mb-2">آية اليوم</p>
          <p
            dir="rtl"
            lang="ar"
            className="leading-[2.3] text-xl text-center"
            style={{ fontFamily: "var(--font-quran)" }}
          >
            {featured.ayah.text}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-ink-muted">
              سورة {featured.surahName} — آية {featured.ayah.ayah}
            </span>
            <Link
              to={`/quran/${featured.ayah.surah}?ayah=${featured.ayah.ayah}`}
              className="text-xs font-semibold text-brand-600"
            >
              فتح في المصحف
            </Link>
          </div>
        </GlassCard>
      )}

      {/* Continue reading */}
      {lastChapter && position && (
        <Link to={`/quran/${lastChapter.id}?ayah=${position.ayah}`}>
          <GlassCard className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400/25 to-sky-500/10 flex items-center justify-center shrink-0">
                <BookOpen className="text-sky-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-ink-muted">متابعة القراءة</p>
                <p className="font-bold">
                  سورة {lastChapter.name} — آية {position.ayah}
                </p>
              </div>
            </div>
          </GlassCard>
        </Link>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-4 gap-2.5">
        {QUICK_LINKS.map(({ to, label, icon: Icon, tint, iconColor }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1.5">
            <div
              className={`glass-btn w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${tint} active:scale-95 transition-transform`}
            >
              <Icon className={iconColor} size={22} />
            </div>
            <span className="text-[11px] text-ink-muted text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      <Link to="/settings">
        <GlassCard className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-400/20 to-rose-500/10 flex items-center justify-center shrink-0">
              <BookmarkIcon className="text-rose-600" size={20} />
            </div>
            <p className="font-semibold text-sm">العلامات المرجعية المحفوظة</p>
          </div>
          <span className="tabular-ltr text-brand-600 font-bold text-sm">{bookmarks.length}</span>
        </GlassCard>
      </Link>
    </div>
  );
}
