import { cn } from "@/lib/utils";

/** Marks options outside the MVP. They are shown, disabled, never faked. */
export function ComingSoon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full bg-surface-2 px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap text-muted",
        className,
      )}
    >
      Coming soon
    </span>
  );
}
