import { NavLink } from "react-router-dom";
import { Home, BookOpen, Search, Clock, Moon, Settings } from "lucide-react";

const ITEMS = [
  { to: "/", label: "الرئيسية", icon: Home, end: true },
  { to: "/quran", label: "القرآن", icon: BookOpen, end: false },
  { to: "/search", label: "البحث", icon: Search, end: false },
  { to: "/prayer-times", label: "المواقيت", icon: Clock, end: false },
  { to: "/relaxation", label: "الراحة", icon: Moon, end: false },
  { to: "/settings", label: "الإعدادات", icon: Settings, end: false },
];

export function BottomNav() {
  return (
    <nav
      className="glass fixed bottom-0 inset-x-0 z-40 rounded-t-3xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="التنقل الرئيسي"
    >
      <ul className="flex justify-around items-stretch px-1 pt-2 pb-1">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 py-2.5 mx-0.5 rounded-[1.35rem] text-[11px] transition-colors ${
                  isActive ? "text-brand-600 font-semibold bg-brand-50 after:absolute after:bottom-1 after:left-1/4 after:right-1/4 after:h-[3px] after:rounded-full after:bg-brand-500" : "text-ink-muted"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={24} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const NAV_TINTS: Record<string, string> = {
  "/": "from-sky-400/30 to-sky-500/10 text-sky-600",
  "/quran": "from-emerald-400/30 to-emerald-500/10 text-emerald-600",
  "/search": "from-indigo-400/30 to-indigo-500/10 text-indigo-600",
  "/prayer-times": "from-teal-400/30 to-teal-500/10 text-teal-600",
  "/relaxation": "from-violet-400/30 to-violet-500/10 text-violet-600",
  "/settings": "from-amber-400/30 to-amber-500/10 text-amber-600",
};

export function SideNav() {
  return (
    <nav
      className="glass hidden md:flex md:flex-col gap-1.5 w-60 shrink-0 h-[calc(100vh-2rem)] sticky top-4 rounded-3xl p-4"
      aria-label="التنقل الرئيسي"
    >
      <div className="px-2 pb-3 mb-2 border-b border-divider">
        <div className="text-xl font-bold text-brand-600 tracking-tight">قُرآن</div>
        <div className="text-[10px] text-ink-muted tracking-[0.2em]">QURAN</div>
      </div>
      {ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            // Every item is a visibly-bounded glass pill at rest (not just
            // on hover) so it unmistakably reads as a clickable button
            // rather than a plain label in a dashboard-style list.
            `glass-btn flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
              isActive
                ? "bg-brand-500! border-brand-500! text-white shadow-md"
                : "text-ink hover:shadow-md hover:-translate-y-0.5"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${
                  isActive ? "bg-white/20!" : NAV_TINTS[to]
                }`}
              >
                <Icon size={17} className={isActive ? "text-white" : undefined} />
              </span>
              <span className="font-medium text-sm">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
