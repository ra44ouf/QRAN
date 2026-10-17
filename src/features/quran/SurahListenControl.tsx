import { useEffect, useRef, useState } from "react";
import {
  Headphones,
  Play,
  Pause,
  Square,
  AlertTriangle,
  WifiOff,
  Download,
  Minus,
  SkipBack,
  Rewind,
  FastForward,
} from "lucide-react";
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

/** Surah audio control with a compact frosted reciter picker and wide mobile player. */
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
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Dismiss the surface, but don't interrupt an active recitation.
        setPanel("closed");
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPanel("closed");
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
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

  // Keep the same reciter selected when moving to another surah.
  useEffect(() => {
    if ((state === "playing" || state === "paused") && reciter) play(reciter);
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
    void audio.play().then(() => setState("playing")).catch(() => {
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
    } else if (state === "paused" || state === "idle") {
      void audio.play().then(() => setState("playing")).catch(() => {
        setState("error");
        setErrorMsg("تعذر بدء التشغيل.");
      });
    }
  }

  function seekBy(seconds: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    setCurrentTime(audio.currentTime);
  }

  function restart() {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      setCurrentTime(0);
      if (audio.paused && state !== "paused") {
        void audio.play().then(() => setState("playing")).catch(() => setState("error"));
      }
    }
  }

  /** Fully stops playback and aborts any in-flight download. */
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
    if (panel !== "closed") setPanel("closed");
    else setPanel(isActive ? "player" : "list");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={togglePanel}
        aria-label="استمع إلى السورة"
        aria-expanded={panel !== "closed"}
        className={`glass-btn w-9 h-9 rounded-full flex items-center justify-center ${isActive ? "text-brand-600" : "text-ink-muted"}`}
      >
        <Headphones size={18} />
      </button>

      {panel === "list" && (
        <div className="listen-panel listen-panel--list animate-[fadeIn_0.2s_ease]" role="dialog" aria-label="اختيار القارئ">
          <div className="listen-panel-heading">
            <p className="text-xs text-ink-muted">اختر القارئ — سورة {surahName}</p>
            <button
              type="button"
              onClick={() => setPanel("closed")}
              aria-label="إغلاق قائمة القراء"
              className="listen-panel-close"
            >
              <Minus size={20} />
            </button>
          </div>
          {!online ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-amber-700">
              <WifiOff size={17} className="shrink-0" />
              الاستماع يحتاج اتصالاً بالإنترنت.
            </div>
          ) : (
            <div className="px-2 pb-2">
              {RECITERS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => play(r)}
                  className="listen-reciter-option"
                >
                  {r.nameAr}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {panel === "player" && reciter && (
        <div className="listen-panel listen-panel--player p-3 sm:p-4 animate-[fadeIn_0.25s_ease]" role="dialog" aria-label="مشغل التلاوة">
          {state === "error" ? (
            <div className="flex items-start gap-3 p-1">
              <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="listen-player-title">تعذر تشغيل التلاوة</p>
                <p className="text-sm text-ink-muted mt-1">{errorMsg}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button onClick={() => play(reciter)} className="px-4 py-2 rounded-full bg-brand-500 text-white text-sm">
                    إعادة المحاولة
                  </button>
                  <button onClick={stop} className="px-4 py-2 rounded-full glass-btn text-brand-600 text-sm">
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 mb-2.5" dir="rtl">
                <div className="min-w-0">
                  <p className="listen-player-title truncate">{reciter.nameAr}</p>
                  <p className="listen-player-subtitle truncate">سورة {surahName}</p>
                </div>
                <a
                  href={audioUrlFor(reciter.id, reciter.bitrate, surah)}
                  download={`${surahName}-${reciter.nameAr}.mp3`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="تنزيل السورة كاملة (mp3) — يعتمد على دعم المتصفح"
                  aria-label="تنزيل السورة"
                  className="listen-download"
                >
                  <Download size={21} />
                </a>
              </div>

              <div className="px-1" dir="ltr">
                <div className="listen-progress-track">
                  <div className="listen-progress-fill" style={{ width: `${progress}%` }} />
                  <span className="listen-progress-thumb" style={{ left: `${progress}%` }} />
                </div>
                <div className="listen-time-row tabular-ltr">
                  <span>{formatTime(currentTime)}</span>
                  <span>{state === "loading" ? "جارِ التحميل…" : formatTime(duration)}</span>
                </div>
              </div>

              <div className="listen-controls" dir="ltr">
                <button onClick={restart} aria-label="العودة إلى بداية السورة" className="listen-control-button" disabled={state === "loading"}>
                  <SkipBack size={23} />
                </button>
                <button onClick={() => seekBy(-10)} aria-label="الرجوع عشر ثوانٍ" className="listen-control-button" disabled={state === "loading"}>
                  <Rewind size={22} />
                </button>
                <button onClick={togglePause} aria-label={state === "playing" ? "إيقاف مؤقت" : "استئناف"} className="listen-control-button listen-control-button--primary" disabled={state === "loading"}>
                  {state === "playing" ? <Pause size={26} /> : <Play size={26} />}
                </button>
                <button onClick={() => seekBy(10)} aria-label="التقديم عشر ثوانٍ" className="listen-control-button" disabled={state === "loading"}>
                  <FastForward size={22} />
                </button>
                <button onClick={stop} aria-label="إيقاف الاستماع" className="listen-control-button">
                  <Square size={20} fill="currentColor" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
