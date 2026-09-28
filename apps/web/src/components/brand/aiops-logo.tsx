import { useId } from "react";

// The AiOps logo (public/brand/aiops-logo.svg, the spacing-corrected version of
// aiops-logo-original.svg) inlined so it can adapt to dark surfaces and use the Inter font loaded
// by the app. Keep the two in sync.

const NAVY = "#10264B";
const TAGLINE = "#29466B";

type Props = {
  /** Show "YOUR DEVOPS AGENT" under the wordmark. */
  tagline?: boolean;
  /** Light lettering for dark backgrounds (the emblem is unchanged). */
  onDark?: boolean;
  /** Rendered height in px; width follows the aspect ratio. */
  height: number;
  className?: string;
};

export function AiOpsLogo({ tagline = true, onDark = false, height, className }: Props) {
  const gradient = `orbit-${useId()}`;
  const ink = onDark ? "#FFFFFF" : NAVY;
  // Without the tagline, crop to the wordmark's bounds.
  const viewBox = tagline ? "180 16 840 316" : "180 16 840 268";
  const [, , w, h] = viewBox.split(" ").map(Number);
  const font = "var(--font-logo), Inter, 'Avenir Next', Montserrat, Arial, sans-serif";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      height={height}
      width={(height * w) / h}
      role="img"
      aria-label="AiOps — Your DevOps Agent"
      className={className}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#11B7E9" />
          <stop offset="0.52" stopColor="#2878E8" />
          <stop offset="1" stopColor="#3436A8" />
        </linearGradient>
      </defs>
      <g fill={ink} fontFamily={font} fontWeight={750}>
        <text x="201" y="220" fontSize="220" letterSpacing="-13">
          Ai
        </text>
        <text x="755" y="220" fontSize="220" letterSpacing="-13">
          ps
        </text>
      </g>
      <g transform="translate(580 151)">
        <circle r="111" fill="none" stroke={`url(#${gradient})`} strokeWidth="27" />
        <circle r="78" fill="#FFFFFF" />
        <path
          d="M0 -56 L10 -13 L53 0 L10 13 L0 56 L-10 13 L-53 0 L-10 -13 Z"
          fill="#10AEE8"
          transform="translate(0 -40) scale(.4)"
        />
        <text
          x="0"
          y="30"
          textAnchor="middle"
          fill={NAVY}
          fontFamily={font}
          fontSize="48"
          fontWeight={750}
          letterSpacing="-2"
        >
          Ops
        </text>
      </g>
      {tagline && (
        <text
          x="600"
          y="316"
          textAnchor="middle"
          fill={onDark ? "#C9D4E3" : TAGLINE}
          fontFamily={font}
          fontSize="34"
          fontWeight={500}
          letterSpacing="8"
        >
          YOUR DEVOPS AGENT
        </text>
      )}
    </svg>
  );
}

/** "Powered By Zosa Agentic", shown on every page. */
export function PoweredBy({ className }: { className?: string }) {
  return (
    <p className={className ?? "text-[12.5px] text-muted"}>
      Powered By <span className="font-medium">Zosa Agentic</span>
    </p>
  );
}
