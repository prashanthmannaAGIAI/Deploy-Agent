"use client";

import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const inputClass =
  "w-full min-h-10 rounded-lg border border-line-2 bg-surface px-3 py-2 hover:enabled:border-muted read-only:bg-surface-2 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted";

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  mono?: boolean;
  onValueChange?: (value: string) => void;
} & Omit<ComponentProps<"input">, "onChange">;

export function Field({ label, hint, mono, className, onValueChange, ...props }: FieldProps) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        autoComplete="off"
        spellCheck={false}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(inputClass, mono && "font-mono text-[13.5px]", className)}
        onChange={(e) => onValueChange?.(e.target.value)}
        {...props}
      />
      {hint && (
        <small id={`${id}-hint`} className="block text-[13px] text-muted">
          {hint}
        </small>
      )}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  onValueChange,
  ...props
}: { label: ReactNode; hint?: ReactNode; onValueChange?: (v: string) => void } & Omit<
  ComponentProps<"textarea">,
  "onChange"
>) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        spellCheck={false}
        className={cn(inputClass, "min-h-24 resize-y font-mono text-[13px]")}
        onChange={(e) => onValueChange?.(e.target.value)}
        {...props}
      />
      {hint && <small className="block text-[13px] text-muted">{hint}</small>}
    </div>
  );
}

export type SelectOption = { value: string; label: string; disabled?: boolean };

export function Select({
  label,
  value,
  options,
  onValueChange,
  hint,
}: {
  label: ReactNode;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={inputClass}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.disabled ? `${o.label} (coming soon)` : o.label}
          </option>
        ))}
      </select>
      {hint && <small className="block text-[13px] text-muted">{hint}</small>}
    </div>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] items-start gap-4">
      {children}
    </div>
  );
}
