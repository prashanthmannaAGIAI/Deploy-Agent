import type { SVGProps } from "react";

// Icons from the prototype: 20×20, stroke-based, inherit currentColor.
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  "aria-hidden": true,
  width: 20,
  height: 20,
} as const;

export const CheckIcon = (p: IconProps) => (
  <svg {...base} strokeWidth={1.8} {...p}>
    <path d="M4 10.5l4 4 8-9" />
  </svg>
);
export const WarnIcon = (p: IconProps) => (
  <svg {...base} strokeWidth={1.6} {...p}>
    <path d="M10 3l8 14H2z" />
    <path d="M10 8v4M10 14.5v.5" />
  </svg>
);
export const InfoIcon = (p: IconProps) => (
  <svg {...base} strokeWidth={1.6} {...p}>
    <circle cx="10" cy="10" r="8" />
    <path d="M10 9v5M10 6v.5" />
  </svg>
);
export const SparkIcon = (p: IconProps) => (
  <svg {...base} strokeWidth={1.6} {...p}>
    <path d="M10 2v4M10 14v4M2 10h4M14 10h4M4.5 4.5l2.5 2.5M13 13l2.5 2.5M4.5 15.5L7 13M13 7l2.5-2.5" />
  </svg>
);
export const LockIcon = (p: IconProps) => (
  <svg {...base} strokeWidth={1.6} {...p}>
    <rect x="4" y="9" width="12" height="9" rx="2" />
    <path d="M7 9V6a3 3 0 016 0v3" />
  </svg>
);

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <rect width="26" height="26" rx="7" fill="var(--accent)" />
      <path
        d="M7 18h12M9 14.5h8M11 11h4"
        stroke="var(--accent-ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
