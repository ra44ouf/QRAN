import { WifiOff, Loader2, Inbox, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ label = "جارِ التحميل…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-muted">
      <Loader2 className="animate-spin" size={28} />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-6 text-ink-muted">
      {icon ?? <Inbox size={32} />}
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="text-sm max-w-xs">{description}</p>}
    </div>
  );
}

export function ErrorState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-6">
      <AlertTriangle size={32} className="text-amber-500" />
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="text-sm max-w-xs text-ink-muted">{description}</p>}
    </div>
  );
}

export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 text-amber-700 text-sm mb-3">
      <WifiOff size={16} />
      <span>لا يوجد اتصال بالإنترنت — المحتوى المحفوظ محليًا متاح للقراءة والبحث</span>
    </div>
  );
}
