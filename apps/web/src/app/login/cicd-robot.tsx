import styles from "./cicd-robot.module.css";

const STAGES = [
  { x: 64, label: "Commit" },
  { x: 168, label: "Build" },
  { x: 272, label: "Test" },
  { x: 376, label: "Scan" },
  { x: 480, label: "Deploy" },
];

const LOG = [
  { text: "$ git push origin main", tone: "cmd" },
  { text: "✓ build   image built in 38s", tone: "ok" },
  { text: "✓ test    212 passed", tone: "ok" },
  { text: "✓ scan    0 critical, 0 high", tone: "ok" },
  { text: "✓ deploy  live, traffic shifted", tone: "ok" },
] as const;

/**
 * Decorative sign-in illustration: the AiOps agent (a small robot wearing the logo's O-ring)
 * runs a pipeline while a terminal logs each stage. Pure SVG + CSS; with reduced motion it
 * shows the finished pipeline without animating.
 */
export function CicdRobot({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 544 360" className={styles.scene} aria-hidden="true">
        <defs>
          <linearGradient id="rb-orbit" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#11B7E9" />
            <stop offset="0.52" stopColor="#2878E8" />
            <stop offset="1" stopColor="#3436A8" />
          </linearGradient>
          <linearGradient id="rb-shell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F4F8FF" />
            <stop offset="1" stopColor="#C9D8F2" />
          </linearGradient>
          <radialGradient id="rb-glow">
            <stop offset="0" stopColor="#11B7E9" stopOpacity="0.9" />
            <stop offset="1" stopColor="#11B7E9" stopOpacity="0" />
          </radialGradient>
          {/* A horizontal line has a zero-height bounding box, so its gradient must use
              user-space coordinates. */}
          <linearGradient
            id="rb-progress"
            gradientUnits="userSpaceOnUse"
            x1="64"
            y1="0"
            x2="480"
            y2="0"
          >
            <stop offset="0" stopColor="#11B7E9" />
            <stop offset="0.52" stopColor="#2878E8" />
            <stop offset="1" stopColor="#6A6CF0" />
          </linearGradient>
          <filter id="rb-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Terminal */}
        <g transform="translate(262 18)">
          <rect width="270" height="150" rx="14" className={styles.terminal} />
          <circle cx="18" cy="17" r="4.5" fill="#F07474" />
          <circle cx="33" cy="17" r="4.5" fill="#E2A94A" />
          <circle cx="48" cy="17" r="4.5" fill="#4BC28A" />
          <text x="252" y="21" textAnchor="end" className={styles.termTitle}>
            aiops · pipeline
          </text>
          {LOG.map((line, i) => (
            <text
              key={line.text}
              x="18"
              y={52 + i * 21}
              className={`${styles.logLine} ${styles[`log${i}`]} ${line.tone === "cmd" ? styles.cmd : styles.ok}`}
            >
              {line.text}
            </text>
          ))}
          <rect x="18" y="140" width="7" height="2" className={styles.cursor} />
        </g>

        {/* Robot */}
        <g className={styles.robot}>
          <ellipse cx="120" cy="266" rx="54" ry="8" className={styles.shadow} />
          <g className={styles.bob}>
            {/* antenna */}
            <line
              x1="120"
              y1="58"
              x2="120"
              y2="38"
              stroke="#C9D8F2"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="120" cy="34" r="13" fill="url(#rb-glow)" className={styles.antennaGlow} />
            <circle cx="120" cy="34" r="6" fill="#11B7E9" />
            {/* head */}
            <rect x="70" y="58" width="100" height="76" rx="28" fill="url(#rb-shell)" />
            <circle cx="66" cy="96" r="8" fill="url(#rb-orbit)" />
            <circle cx="174" cy="96" r="8" fill="url(#rb-orbit)" />
            <rect x="82" y="76" width="76" height="40" rx="20" fill="#0B1530" />
            <g className={styles.eyes}>
              <rect x="100" y="89" width="12" height="14" rx="6" fill="#11B7E9" />
              <rect x="128" y="89" width="12" height="14" rx="6" fill="#11B7E9" />
            </g>
            <path
              d="M108 124 Q120 130 132 124"
              stroke="#8FA2C4"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            {/* neck + body */}
            <rect x="110" y="134" width="20" height="10" rx="4" fill="#AFC3E6" />
            <rect x="78" y="144" width="84" height="84" rx="24" fill="url(#rb-shell)" />
            {/* chest: the AiOps O-ring */}
            <circle cx="120" cy="184" r="21" fill="#FFFFFF" />
            <circle
              cx="120"
              cy="184"
              r="21"
              fill="none"
              stroke="url(#rb-orbit)"
              strokeWidth="6"
              className={styles.ring}
            />
            {/* Positioned by the group; CSS animates only the inner shape (a CSS transform
                would replace the SVG transform attribute). */}
            <g transform="translate(120 184) scale(.2)">
              <path
                d="M0 -56 L10 -13 L53 0 L10 13 L0 56 L-10 13 L-53 0 L-10 -13 Z"
                fill="#10AEE8"
                className={styles.sparkle}
              />
            </g>
            {/* legs */}
            <rect x="94" y="226" width="16" height="26" rx="8" fill="#AFC3E6" />
            <rect x="130" y="226" width="16" height="26" rx="8" fill="#AFC3E6" />
            {/* left arm (resting) */}
            <rect x="60" y="154" width="16" height="50" rx="8" fill="#C9D8F2" />
            {/* right arm, tapping the console */}
            <g className={styles.arm}>
              <rect x="164" y="152" width="16" height="54" rx="8" fill="#C9D8F2" />
              <circle cx="172" cy="206" r="9" fill="url(#rb-orbit)" />
            </g>
          </g>
          {/* console the robot is working on */}
          <g transform="translate(176 206)">
            <rect
              width="78"
              height="46"
              rx="8"
              fill="#0B1530"
              stroke="#2878E8"
              strokeOpacity=".6"
            />
            <rect
              x="8"
              y="9"
              width="40"
              height="4"
              rx="2"
              fill="#11B7E9"
              className={styles.consoleA}
            />
            <rect
              x="8"
              y="19"
              width="58"
              height="4"
              rx="2"
              fill="#7C9BFF"
              className={styles.consoleB}
            />
            <rect
              x="8"
              y="29"
              width="30"
              height="4"
              rx="2"
              fill="#4BC28A"
              className={styles.consoleC}
            />
            <rect x="-6" y="46" width="90" height="6" rx="3" fill="#1D2F57" />
          </g>
        </g>

        {/* Pipeline */}
        <g transform="translate(0 312)">
          <line x1={STAGES[0].x} y1="0" x2={STAGES[4].x} y2="0" className={styles.track} />
          <line
            x1={STAGES[0].x}
            y1="0"
            x2={STAGES[4].x}
            y2="0"
            stroke="url(#rb-progress)"
            className={styles.progress}
          />
          {STAGES.map((s, i) => (
            <g key={s.label} transform={`translate(${s.x} 0)`}>
              <circle r="13" className={styles.node} />
              <g className={`${styles.done} ${styles[`stage${i}`]}`}>
                <circle r="13" fill="url(#rb-orbit)" />
                <path
                  d="M-5 0.5 L-1.5 4 L5.5 -3.5"
                  stroke="#FFFFFF"
                  strokeWidth="2.4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <text y="32" textAnchor="middle" className={styles.stageLabel}>
                {s.label}
              </text>
            </g>
          ))}
          {/* the build moving through the pipeline */}
          <g className={styles.packet}>
            <circle r="16" fill="#11B7E9" opacity=".35" filter="url(#rb-soft)" />
            <circle r="5" fill="#FFFFFF" />
          </g>
          <g transform={`translate(${STAGES[4].x} -34)`} className={styles.live}>
            <rect
              x="-30"
              y="-12"
              width="60"
              height="22"
              rx="11"
              fill="#12302A"
              stroke="#4BC28A"
              strokeOpacity=".7"
            />
            <circle cx="-16" cy="-1" r="3.5" fill="#4BC28A" />
            <text x="4" y="3.5" textAnchor="middle" className={styles.liveText}>
              Live
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
