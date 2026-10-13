import { useEffect, useRef, useState } from "react";
import { Headphones, Play, Pause, Square, AlertTriangle, WifiOff, Download } from "lucide-react";
import { RECITERS, audioUrlFor, type Reciter } from "../../lib/reciters";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

type PlayerState = "idle" | "loading" | "playing" | "paused" | "error";
type PanelView = "closed" | "list" | "player";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "٠:٠٠";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Top-bar "استمع" control. Clicking the headphone icon opens a small
 * panel listing reciters; picking one animates the SAME panel into a
 * single elongated player bar (time, play/pause, stop, download) instead
 * of popping a separate floating element — this also fixes the earlier
 * bug where the floating player could sit under the bottom nav bar and
 * become hard to reach on mobile.
 */
export function SurahListenControl({ surah, surahName }: { surah: number; surahName: string }) {
  const online = useOnlineStatus();
  const [panel, setPanel] = useState<PanelView>("closed");
  const [state, setState] = useState<PlayerState>("idle");
  const [reciter, setReciter] = useState<Reciter | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isActive = state === "playing" || state === "paused" || state === "loading";

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (!containerRef.current || containerRef.current.contains(e.target as Node)) return;
      // Collapse the panel on outside click, but never stop playback just
      // because the user tapped elsewhere — only an explicit stop does that.
      setPanel("closed");
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
    };
  }, []);

  // Switch surah while already playing: follow along with the same reciter.
  useEffect(() => {
    if (state === "playing" || state === "paused") {
      if (reciter) play(reciter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surah]);

  function play(r: Reciter) {
    setReciter(r);
    setState("loading");
    setErrorMsg(null);
    setPanel("player");
    setCurrentTime(0);
    setDuration(0);

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    audio.src = audioUrlFor(r.id, r.bitrate, surah);
    audio.onerror = () => {
      setState("error");
      setErrorMsg(`تعذر تحميل تلاوة ${r.nameAr} لسورة ${surahName}. جرّب قارئًا آخر أو أعد المحاولة لاحقًا.`);
    };
    audio.onended = () => setState("idle");
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onloadedmetadata = () => setDuration(audio.duration || 0);
    audio
      .play()
      .then(() => setState("playing"))
      .catch(() => {
        setState("error");
        setErrorMsg("تعذر بدء التشغيل.");
      });
  }

  function togglePause() {
    const audio = audioRef.current;
    if (!audio) return;
    if (state === "playing") {
      audio.pause();
      setState("paused");
    } else if (state === "paused") {
      void audio.play().then(() => setState("playing"));
    }
  }

  /** Fully stops playback AND aborts any in-flight download — just calling
   * .pause() is not enough if the browser is still fetching the file. */
  function stop() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setState("idle");
    setReciter(null);
    setPanel("closed");
    setCurrentTime(0);
    setDuration(0);
    setErrorMsg(null);
  }

  function togglePanel() {
    if (panel !== "closed") {
      setPanel("closed");
    } else {
      setPanel(isActive ? "player" : "list");
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={togglePanel}
        aria-label="استمع إلى السورة"
        aria-expanded={panel !== "closed"}
        className={`glass-btn w-9 h-9 rounded-full flex items-center justify-center ${
          isActive ? "text-brand-600" : "text-ink-muted"
        }`}
      >
        <Headphones size={18} />
      </button>

      {panel !== "closed" && (
        <div
          className={`glass absolute left-0 top-11 rounded-2xl z-50 shadow-lg overflow-hidden transition-[width] duration-300 ease-out ${
            panel === "player" ? "w-[19rem]" : "w-64"
          }`}
        >
          {panel === "list" && (
            <div className="p-2 animate-[fadeIn_0.2s_ease]">
              {!online ? (
                <div className="flex items-center gap-2 p-3 text-xs text-amber-700">
                  <WifiOff size={16} className="shrink-0" />
                  الاستماع يحتاج اتصالاً بالإنترنت.
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-ink-muted px-2 pt-1 pb-2">
                    اختر القارئ — سورة {surahName}
                  </p>
                  {RECITERS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => play(r)}
                      className="w-full text-right px-3 py-2 rounded-xl text-sm hover:bg-brand-50 transition-colors"
                    >
                      {r.nameAr}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {panel === "player" && reciter && (
            <div className="p-3 animate-[fadeIn_0.25s_ease]">
              {state === "error" ? (
                <div className="flex items-start gap-2 p-1">
                  <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-ink-muted">{errorMsg}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => play(reciter)}
                        className="px-3 py-1 rounded-full bg-brand-500 text-white text-xs"
                      >
                        إعادة المحاولة
                      </button>
                      <button
                        onClick={stop}
                        className="px-3 py-1 rounded-full glass-btn text-brand-600 text-xs"
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{reciter.nameAr}</p>
                      <p className="text-[11px] text-ink-muted truncate">سورة {surahName}</p>
                    </div>
                    <a
                      href={audioUrlFor(reciter.id, reciter.bitrate, surah)}
                      download={`${surahName}-${reciter.nameAr}.mp3`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="تنزيل السورة كاملة (mp3) — يعتمد على دعم المتصفح"
                      aria-label="تنزيل السورة"
                      className="glass-btn w-8 h-8 rounded-full flex items-center justify-center text-brand-600 shrink-0"
                    >
                      <Download size={15} />
                    </a>
                  </div>

                  {/* progress bar + time */}
                  <div className="mb-2">
                    <div className="h-1.5 rounded-full bg-brand-100 overflow-hidden">
                      <div
                        className="h-full bg-brand-500 transition-[width] duration-200"
                        style={{
                          width: duration > 0 ? `${Math.min(100, (currentTime / duration) * 100)}%` : "0%",
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-ink-muted tabular-ltr">
                      <span>{formatTime(currentTime)}</span>
                      <span>{state === "loading" ? "جارِ التحميل…" : formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={togglePause}
                      disabled={state === "loading"}
                      aria-label={state === "playing" ? "إيقاف مؤقت" : "استئناف"}
                      className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center disabled:opacity-50"
                    >
                      {state === "playing" ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                      onClick={stop}
                      aria-label="إيقاف الاستماع"
                      className="glass-btn w-10 h-10 rounded-full text-brand-600 flex items-center justify-center"
                    >
                      <Square size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
