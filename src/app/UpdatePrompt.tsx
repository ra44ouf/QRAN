import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, CheckCircle2, X } from "lucide-react";

/**
 * Shows a small, dismissible banner when:
 *  - the app has just finished caching everything for offline use, or
 *  - a new version was downloaded and is ready to activate.
 *
 * We deliberately use registerType: "prompt" in vite.config.ts (not
 * "autoUpdate") so the user is never silently switched to new app code
 * while mid-session — they confirm the reload themselves (spec 10.1).
 */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Check for an updated service worker periodically while the app is
      // open, without hammering the network.
      if (registration) {
        setInterval(() => void registration.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!offlineReady && !needRefresh) return null;

  function close() {
    setOfflineReady(false);
    setNeedRefresh(false);
  }

  return (
    <div
      className="glass fixed z-50 left-3 right-3 md:left-auto md:w-96 rounded-2xl p-4 flex items-start gap-3 shadow-lg"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
      role="status"
    >
      {needRefresh ? (
        <RefreshCw className="text-brand-600 shrink-0 mt-0.5" size={20} />
      ) : (
        <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={20} />
      )}
      <div className="flex-1 text-sm">
        {needRefresh ? (
          <>
            <p className="font-semibold">يتوفر تحديث جديد للتطبيق</p>
            <p className="text-ink-muted text-xs mt-0.5">
              التحديث جاهز، وسيُطبَّق دون أن يؤثر على بياناتك المحفوظة.
            </p>
            <button
              onClick={() => void updateServiceWorker(true)}
              className="mt-2 px-3 py-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold"
            >
              تحديث الآن
            </button>
          </>
        ) : (
          <>
            <p className="font-semibold">التطبيق جاهز للعمل دون إنترنت</p>
            <p className="text-ink-muted text-xs mt-0.5">
              تم حفظ القرآن والتفسير والبحث على جهازك.
            </p>
          </>
        )}
      </div>
      <button onClick={close} aria-label="إغلاق" className="p-1 text-ink-muted">
        <X size={16} />
      </button>
    </div>
  );
}
