import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Moon, WifiOff, AlertTriangle } from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { GlassCard } from "../../components/GlassCard";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { RECITERS, audioUrlFor, randomReciter, randomSurah, type Reciter } from "../../lib/reciters";
import { loadChapters } from "../../lib/dataLoader";
import type { ChapterMeta } from "../../lib/types";

const DURATIONS = [5, 10, 15, 20, 30];

type SessionState = "idle" | "loading" | "playing" | "paused" | "error" | "finished";

export function RelaxationPage() {
  const online = useOnlineStatus();
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [durationMin, setDurationMin] = useState(10);
  const [customDuration, setCustomDuration] = useState("");
  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
  const [state, setState] = useState<SessionState>("idle");
  const [currentTrack, setCurrentTrack] = useState<{ reciter: Reciter; surah: number } | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionEndRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    void loadChapters().then(setChapters);
  }, []);

  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      audioRef.current?.pause();
    };
  }, []);

  function effectiveDuration(): number {
    const custom = Number(customDuration);
    return custom > 0 ? custom : durationMin;
  }

  function startTick() {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      const remaining = sessionEndRef.current - Date.now();
      if (remaining <= 0) {
        finishSession();
      } else {
        setRemainingMs(remaining);
      }
    }, 1000);
  }

  function playTrack(reciter: Reciter, surah: number) {
    setState("loading");
    setErrorMsg(null);
    setCurrentTrack({ reciter, surah });

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    audio.src = audioUrlFor(reciter.id, reciter.bitrate, surah);

    audio.onerror = () => {
      setState("error");
      setErrorMsg(
        `تعذر تحميل التلاوة (${reciter.nameAr} — سورة رقم ${surah}). قد يكون الرابط غير متاح حاليًا أو انقطع الاتصال.`,
      );
    };
    audio.onended = () => {
      // Track ended before the session duration elapsed: policy is to
      // continue with another random track (spec 9.2) rather than silently
      // stopping, unless the session itself has actually finished.
      if (Date.now() < sessionEndRef.current) {
        const nextReciter = selectedReciter ?? randomReciter();
        playTrack(nextReciter, randomSurah());
      } else {
        finishSession();
      }
    };
    audio
      .play()
      .then(() => setState("playing"))
      .catch(() => {
        setState("error");
        setErrorMsg("تعذر بدء التشغيل. قد يطلب المتصفح تفاعلاً مباشرًا من المستخدم لبدء الصوت.");
      });
  }

  function startSession() {
    if (!online) return;
    const mins = effectiveDuration();
    if (!mins || mins <= 0) return;
    sessionEndRef.current = Date.now() + mins * 60_000;
    setRemainingMs(mins * 60_000);
    startTick();
    const reciter = selectedReciter ?? randomReciter();
    playTrack(reciter, randomSurah());
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

  function finishSession() {
    if (tickRef.current) window.clearInterval(tickRef.current);
    audioRef.current?.pause();
    setState("finished");
    setRemainingMs(0);
  }

  function stopSession() {
    if (tickRef.current) window.clearInterval(tickRef.current);
    audioRef.current?.pause();
    setState("idle");
    setCurrentTrack(null);
    setRemainingMs(0);
  }

  const chapterName = (id: number) => chapters.find((c) => c.id === id)?.name ?? id;
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  return (
    <div className="max-w-2xl mx-auto">
      <TopBar title="وضع الراحة" subtitle="استماع إلى التلاوات — يتطلب إنترنت" />

      {!online && (
        <GlassCard className="p-4 my-3 flex items-center gap-3 bg-amber-50/60">
          <WifiOff className="text-amber-600 shrink-0" size={22} />
          <p className="text-sm text-amber-700">
            هذه الميزة تحتاج اتصالاً بالإنترنت لتشغيل التلاوات الصوتية. باقي أقسام التطبيق (القراءة،
            البحث، التفسير) تعمل دون إنترنت.
          </p>
        </GlassCard>
      )}

      {state === "idle" && (
        <div className="space-y-4 my-3">
          <GlassCard className="p-4">
            <p className="text-sm font-semibold mb-2">مدة الجلسة</p>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDurationMin(d);
                    setCustomDuration("");
                  }}
                  className={`px-4 py-2 rounded-full text-sm tabular-ltr transition-colors ${
                    durationMin === d && !customDuration
                      ? "bg-brand-500 text-white"
                      : "glass-btn text-brand-600"
                  }`}
                >
                  {d} د
                </button>
              ))}
              <input
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value.replace(/\D/g, ""))}
                placeholder="مخصّصة (دقيقة)"
                inputMode="numeric"
                className="glass rounded-full px-4 py-2 text-sm w-32 outline-none"
              />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-sm font-semibold mb-2">القارئ</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setSelectedReciter(null)}
                className={`text-right px-3 py-2 rounded-xl text-sm transition-colors ${
                  selectedReciter === null ? "bg-brand-500 text-white font-semibold" : "glass-btn"
                }`}
              >
                عشوائي من بين القراء المتاحين
              </button>
              {RECITERS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReciter(r)}
                  className={`text-right px-3 py-2 rounded-xl text-sm transition-colors ${
                    selectedReciter?.id === r.id ? "bg-brand-500 text-white font-semibold" : "glass-btn"
                  }`}
                >
                  {r.nameAr}
                </button>
              ))}
            </div>
          </GlassCard>

          <button
            onClick={startSession}
            disabled={!online}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand-500 text-white font-bold disabled:opacity-40"
          >
            <Moon size={18} /> بدء جلسة الاسترخاء
          </button>
        </div>
      )}

      {(state === "loading" || state === "playing" || state === "paused") && (
        <GlassCard className="p-8 my-3 text-center space-y-4">
          <Moon className="mx-auto text-brand-500" size={36} />
          {currentTrack && (
            <div>
              <p className="font-bold text-lg">{currentTrack.reciter.nameAr}</p>
              <p className="text-sm text-ink-muted">سورة {chapterName(currentTrack.surah)}</p>
            </div>
          )}
          {state === "loading" && <p className="text-sm text-ink-muted">جارِ التحميل…</p>}
          <p className="text-3xl font-bold tabular-ltr text-brand-600">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={togglePause}
              disabled={state === "loading"}
              aria-label={state === "playing" ? "إيقاف مؤقت" : "استئناف"}
              className="w-14 h-14 rounded-full bg-brand-500 text-white flex items-center justify-center disabled:opacity-40"
            >
              {state === "playing" ? <Pause size={22} /> : <Play size={22} />}
            </button>
            <button
              onClick={stopSession}
              aria-label="إنهاء الجلسة"
              className="glass-btn w-14 h-14 rounded-full text-brand-600 flex items-center justify-center"
            >
              <Square size={20} />
            </button>
          </div>
          <p className="text-[11px] text-ink-muted">
            استخدم أزرار الصوت في جهازك أو عناصر تحكم المتصفح لضبط مستوى الصوت.
          </p>
        </GlassCard>
      )}

      {state === "error" && (
        <GlassCard className="p-6 my-3 text-center space-y-3">
          <AlertTriangle className="mx-auto text-amber-500" size={32} />
          <p className="text-sm text-ink-muted">{errorMsg}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => playTrack(selectedReciter ?? randomReciter(), randomSurah())}
              className="px-4 py-2 rounded-full bg-brand-500 text-white text-sm"
            >
              إعادة المحاولة
            </button>
            <button onClick={stopSession} className="glass-btn px-4 py-2 rounded-full text-brand-600 text-sm">
              إنهاء
            </button>
          </div>
        </GlassCard>
      )}

      {state === "finished" && (
        <GlassCard className="p-8 my-3 text-center space-y-3">
          <Moon className="mx-auto text-brand-500" size={32} />
          <p className="font-semibold">انتهت الجلسة</p>
          <button onClick={stopSession} className="px-5 py-2 rounded-full bg-brand-500 text-white text-sm">
            رجوع
          </button>
        </GlassCard>
      )}
    </div>
  );
}
