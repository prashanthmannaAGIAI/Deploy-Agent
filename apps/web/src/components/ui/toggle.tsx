"use client";

import { Switch } from "radix-ui";
import { useId, type ReactNode } from "react";

/** Toggle row from the prototype: switch, bold label, muted description, top border. */
export function Toggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="grid grid-cols-[auto_1fr] items-start gap-3 border-t border-line py-3">
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={description ? `${id}-d` : undefined}
        className="relative mt-0.5 h-5 w-9 cursor-pointer rounded-[10px] bg-line-2 transition-colors data-[state=checked]:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Switch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[18px]" />
      </Switch.Root>
      <label htmlFor={id} className="cursor-pointer">
        <b className="font-medium">{label}</b>
        {description && (
          <small id={`${id}-d`} className="block text-[13px] text-muted">
            {description}
          </small>
        )}
      </label>
    </div>
  );
}
