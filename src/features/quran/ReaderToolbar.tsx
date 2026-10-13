import { Minus, Plus, ScrollText, FileStack } from "lucide-react";
import type { ReaderSettings, ReadingBackground } from "../../lib/types";

export const BACKGROUND_OPTIONS: { id: ReadingBackground; labelAr: string; swatch: string }[] = [
  { id: "pure-white", labelAr: "أبيض نقي", swatch: "#ffffff" },
  { id: "warm-white", labelAr: "أبيض دافئ", swatch: "#fdfbf6" },
  { id: "ivory", labelAr: "عاجي هادئ", swatch: "#faf6ec" },
  { id: "snow-blue", labelAr: "أزرق ثلجي", swatch: "#f3f8fc" },
  { id: "pale-blue", labelAr: "أزرق فاتح", swatch: "#eef6fb" },
  { id: "glass", labelAr: "زجاجي خفيف", swatch: "rgba(255,255,255,0.6)" },
  // Dim background for the reading page itself only (spec request: "ليس
  // الوضع الداكن العام للتطبيق") — the rest of the app (nav bars, cards,
  // settings) stays light-only as originally required.
  { id: "night", labelAr: "داكنة مريحة ليلاً", swatch: "#202b38" },
];

/** True for backgrounds dark enough that ayah text/badges need light ink. */
export function isDarkBackground(bg: ReadingBackground): boolean {
  return bg === "night";
}

export function backgroundStyle(bg: ReadingBackground): React.CSSProperties {
  if (bg === "glass") {
    return { background: "rgba(255,255,255,0.55)", backdropFilter: "blur(10px)" };
  }
  if (bg === "night") {
    return { background: "var(--color-read-night-bg)" };
  }
  const found = BACKGROUND_OPTIONS.find((b) => b.id === bg);
  return { background: found?.swatch ?? "#ffffff" };
}

export function ReaderToolbar({
  settings,
  onChange,
}: {
  settings: ReaderSettings;
  onChange: (next: ReaderSettings) => void;
}) {
  return (
    <div className="glass rounded-3xl p-3 flex flex-col gap-3 sticky top-[4.5rem] z-20">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-ink-muted">حجم الخط</span>
        <div className="flex items-center gap-2">
          <button
            aria-label="تصغير الخط"
            onClick={() => onChange({ ...settings, fontSizePx: Math.max(20, settings.fontSizePx - 2) })}
            className="glass-btn w-8 h-8 rounded-full text-brand-600 flex items-center justify-center"
          >
            <Minus size={16} />
          </button>
          <span className="tabular-ltr text-sm w-8 text-center inline-block">{settings.fontSizePx}</span>
          <button
            aria-label="تكبير الخط"
            onClick={() => onChange({ ...settings, fontSizePx: Math.min(48, settings.fontSizePx + 2) })}
            className="glass-btn w-8 h-8 rounded-full text-brand-600 flex items-center justify-center"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-ink-muted">نمط القراءة</span>
        <div className="glass-btn flex rounded-full p-0.5">
          <button
            onClick={() => onChange({ ...settings, mode: "scroll" })}
            aria-pressed={settings.mode === "scroll"}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors ${
              settings.mode === "scroll" ? "bg-white/90 shadow text-brand-600" : "text-ink-muted"
            }`}
          >
            <ScrollText size={14} /> تمرير
          </button>
          <button
            onClick={() => onChange({ ...settings, mode: "paged" })}
            aria-pressed={settings.mode === "paged"}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors ${
              settings.mode === "paged" ? "bg-white/90 shadow text-brand-600" : "text-ink-muted"
            }`}
          >
            <FileStack size={14} /> صفحات
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-ink-muted">خلفية صفحة القراءة</span>
        <div className="flex gap-1.5">
          {BACKGROUND_OPTIONS.map((bg) => (
            <button
              key={bg.id}
              aria-label={bg.labelAr}
              aria-pressed={settings.background === bg.id}
              title={bg.labelAr}
              onClick={() => onChange({ ...settings, background: bg.id })}
              className={`w-6 h-6 rounded-full border-2 transition-shadow ${
                settings.background === bg.id
                  ? "border-brand-500 shadow-[0_0_0_2px_rgba(46,109,166,0.18)]"
                  : "border-divider"
              }`}
              style={{ background: bg.swatch }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
