import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const styles = {
  idle: "bg-surface-2 border-line",
  run: "text-accent bg-accent-soft border-transparent",
  ok: "text-ok bg-ok-soft border-transparent",
  bad: "text-err bg-err-soft border-transparent",
} as const;

export function Pill({
  kind = "idle",
  children,
}: {
  kind?: keyof typeof styles;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] font-medium",
        styles[kind],
      )}
    >
      <span className={cn("size-2 rounded-full bg-current", kind === "run" && "pill-run-dot")} />
      {children}
    </span>
  );
}
