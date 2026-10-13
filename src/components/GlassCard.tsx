import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
  as: Component = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Component className={`glass rounded-3xl ${className}`}>{children}</Component>
  );
}
