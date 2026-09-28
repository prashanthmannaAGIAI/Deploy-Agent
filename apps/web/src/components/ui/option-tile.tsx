import type { ReactNode } from "react";

import { ComingSoon } from "./coming-soon";

export function OptionGrid({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3"
    >
      {children}
    </div>
  );
}

/** Option tile from the prototype. Disabled tiles are shown with "Coming soon", never faked. */
export function OptionTile({
  selected,
  onSelect,
  mark,
  title,
  lines,
  badge,
  disabled,
}: {
  selected: boolean;
  onSelect: () => void;
  mark?: string;
  title: string;
  lines: ReactNode[];
  badge?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className="relative grid cursor-pointer gap-1.5 rounded-xl border border-line-2 bg-surface p-4 text-left hover:enabled:border-muted disabled:cursor-not-allowed disabled:opacity-60 aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:shadow-[0_0_0_1px_var(--accent)]"
    >
      {mark && (
        <span className="grid size-9 place-items-center rounded-lg border border-line bg-surface-2 text-[13px] font-semibold">
          {mark}
        </span>
      )}
      <b className="font-semibold">{title}</b>
      {lines.map((l, i) => (
        <small key={i} className="text-[13px] leading-[1.45] text-muted">
          {l}
        </small>
      ))}
      <span className="absolute top-3 right-3">{disabled ? <ComingSoon /> : badge}</span>
    </button>
  );
}
