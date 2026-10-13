import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Info, CheckCircle2, XCircle } from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { GlassCard } from "../../components/GlassCard";
import { EmptyState } from "../../components/StateViews";
import { useBookmarks } from "../../hooks/useBookmarks";
import { removeBookmark } from "../../lib/db";
import { getReaderSettings, setReaderSettings } from "../../lib/settings";
import { ReaderToolbar } from "../quran/ReaderToolbar";
import { loadQuranSourceMeta, loadTafsirSourceMeta, type SourceMeta } from "../../lib/dataLoader";
import type { ReaderSettings as ReaderSettingsT } from "../../lib/types";

export function SettingsPage() {
  const { bookmarks, refresh } = useBookmarks();
  const [settings, setSettings] = useState<ReaderSettingsT>(() => getReaderSettings());
  const [quranSource, setQuranSource] = useState<SourceMeta | null>(null);
  const [tafsirSource, setTafsirSource] = useState<SourceMeta | null>(null);
  const [cacheStatus, setCacheStatus] = useState<"checking" | "ready" | "partial">("checking");

  useEffect(() => {
    void loadQuranSourceMeta().then(setQuranSource);
    void loadTafsirSourceMeta().then(setTafsirSource);
  }, []);

  useEffect(() => {
    if (!("caches" in window)) {
      setCacheStatus("partial");
      return;
    }
    void (async () => {
      try {
        const keys = await caches.keys();
        let found = false;
        for (const key of keys) {
          const cache = await caches.open(key);
          if (await cache.match("/data/search-index.json")) found = true;
        }
        setCacheStatus(found ? "ready" : "partial");
      } catch {
        setCacheStatus("partial");
      }
    })();
  }, []);

  function updateSettings(next: ReaderSettingsT) {
    setSettings(next);
    setReaderSettings(next);
  }

  async function handleRemove(id: string) {
    await removeBookmark(id);
    await refresh();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <TopBar title="الإعدادات" />

      <section>
        <h2 className="text-sm font-bold text-ink-muted mb-2 px-1">تفضيلات القراءة</h2>
        <ReaderToolbar settings={settings} onChange={updateSettings} />
      </section>

      <section>
        <h2 className="text-sm font-bold text-ink-muted mb-2 px-1">العلامات المرجعية ({bookmarks.length})</h2>
        <GlassCard className="divide-y divide-divider overflow-hidden">
          {bookmarks.length === 0 && (
            <EmptyState title="لا توجد علامات مرجعية بعد" description="يمكنك إضافة علامة أثناء القراءة" />
          )}
          {bookmarks.map((b) => (
            <div key={b.id} className="flex items-center justify-between px-4 py-3">
              <Link to={`/quran/${b.surah}?ayah=${b.ayah}`} className="flex-1">
                <p className="font-semibold text-sm">
                  سورة {b.surahName} — آية {b.ayah}
                </p>
                <p className="text-[11px] text-ink-muted">
                  {new Date(b.createdAt).toLocaleDateString("ar")}
                </p>
              </Link>
              <button
                onClick={() => void handleRemove(b.id)}
                aria-label="حذف العلامة"
                className="p-2 rounded-full hover:bg-red-50 text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </GlassCard>
      </section>

      <section>
        <h2 className="text-sm font-bold text-ink-muted mb-2 px-1">حالة البيانات دون إنترنت</h2>
        <GlassCard className="p-4 flex items-center gap-3">
          {cacheStatus === "ready" ? (
            <CheckCircle2 className="text-green-600 shrink-0" size={22} />
          ) : (
            <XCircle className="text-amber-500 shrink-0" size={22} />
          )}
          <p className="text-sm text-ink-muted">
            {cacheStatus === "checking" && "جارِ التحقق من جاهزية البيانات دون إنترنت…"}
            {cacheStatus === "ready" &&
              "بيانات القرآن والتفسير والبحث محفوظة محليًا وجاهزة للعمل دون إنترنت."}
            {cacheStatus === "partial" &&
              "لم يتم بعد تأكيد حفظ كل البيانات محليًا. افتح التطبيق مرة واحدة وأنت متصل بالإنترنت لإكمال التهيئة."}
          </p>
        </GlassCard>
      </section>

      <section>
        <h2 className="text-sm font-bold text-ink-muted mb-2 px-1">مصادر المحتوى والتراخيص</h2>
        <GlassCard className="p-4 space-y-3 text-sm">
          <div className="flex gap-2">
            <Info size={16} className="text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{quranSource?.nameAr ?? "نص القرآن الكريم"}</p>
              <p className="text-xs text-ink-muted">{String(quranSource?.license ?? "")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Info size={16} className="text-brand-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{tafsirSource?.nameAr ?? "التفسير"}</p>
              <p className="text-xs text-ink-muted">{String(tafsirSource?.author ?? "")}</p>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
