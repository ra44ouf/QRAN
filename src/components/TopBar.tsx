import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function TopBar({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: boolean;
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header
      className="glass sticky top-0 z-30 flex items-center gap-2 px-3 py-3 rounded-b-3xl md:rounded-3xl md:mb-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.6rem)" }}
    >
      {onBack && (
        <button
          onClick={() => navigate(-1)}
          aria-label="رجوع"
          className="glass-btn p-2 -mr-1 rounded-full text-brand-600"
        >
          <ChevronRight size={22} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold truncate">{title}</h1>
        {subtitle && <p className="text-xs text-ink-muted truncate">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
