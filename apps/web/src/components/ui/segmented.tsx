"use client";

import { RadioGroup } from "radix-ui";
import { useId, type ReactNode } from "react";

export type SegmentOption<T extends string> = { value: T; label: ReactNode; disabled?: boolean };

/** Segmented control from the prototype, built on Radix RadioGroup (arrow-key navigation). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onValueChange,
  "aria-label": ariaLabel,
}: {
  label?: ReactNode;
  value: T;
  options: SegmentOption<T>[];
  onValueChange: (value: T) => void;
  "aria-label"?: string;
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      {label && (
        <span id={id} className="text-sm font-medium">
          {label}
        </span>
      )}
      <RadioGroup.Root
        value={value}
        onValueChange={(v) => onValueChange(v as T)}
        aria-labelledby={label ? id : undefined}
        aria-label={ariaLabel}
        orientation="horizontal"
        className="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-[10px] border border-line bg-surface-2 p-1"
      >
        {options.map((o) => (
          <RadioGroup.Item
            key={o.value}
            value={o.value}
            disabled={o.disabled}
            className="cursor-pointer rounded-[7px] px-3.5 py-1.5 font-medium text-muted data-[state=checked]:bg-surface data-[state=checked]:text-ink data-[state=checked]:shadow-[0_0_0_1px_var(--line-2)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {o.label}
            {o.disabled && <span className="ml-1.5 text-[11.5px] font-normal">(coming soon)</span>}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
}
