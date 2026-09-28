import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { CheckIcon, InfoIcon, SparkIcon, WarnIcon } from "./icons";

const styles = {
  neutral: "bg-surface-2 border-line",
  ok: "bg-ok-soft border-transparent",
  warn: "bg-warn-soft border-transparent",
  err: "bg-err-soft border-transparent",
  agent: "bg-accent-soft border-transparent",
} as const;

const icons = { neutral: InfoIcon, ok: CheckIcon, warn: WarnIcon, err: WarnIcon, agent: SparkIcon };

export function Note({
  kind = "neutral",
  children,
  className,
  role,
}: {
  kind?: keyof typeof styles;
  children: ReactNode;
  className?: string;
  role?: string;
}) {
  const Icon = icons[kind];
  return (
    <div
      role={role}
      className={cn(
        "grid grid-cols-[auto_1fr] gap-3 rounded-[10px] border px-4 py-3.5 text-sm",
        styles[kind],
        className,
      )}
    >
      <Icon className="mt-px size-5 flex-none" />
      <div>
        {kind === "agent" && (
          <div className="mb-0.5 text-[13px] font-semibold text-accent">Runway agent</div>
        )}
        {children}
      </div>
    </div>
  );
}
