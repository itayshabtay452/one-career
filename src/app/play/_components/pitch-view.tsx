import type { MomentKind } from "@/engine";

import styles from "../play.module.css";

type PitchViewProps = {
  kind: MomentKind;
  pressure: number;
  label: string;
};

/**
 * A top down sketch of the situation.
 *
 * It deliberately shows only what a player could read from the pitch: where the
 * ball is, how much company they have and where the goal is. The ideal aim,
 * ideal power and expected action stay hidden, because reading the moment is
 * the skill the product spec asks for.
 */
export function PitchView({ kind, pressure, label }: PitchViewProps) {
  // More pressure means more bodies around the ball, from one to four.
  const defenders = Math.min(4, 1 + Math.floor(pressure / 26));
  const attackingSide = kind === "tackle";

  return (
    <svg
      className={styles.pitch}
      viewBox="0 0 320 180"
      role="img"
      aria-label={label}
    >
      <rect x="0" y="0" width="320" height="180" rx="14" fill="rgba(9,26,18,0.9)" />
      <g stroke="rgba(220,255,223,0.18)" strokeWidth="1.5" fill="none">
        <rect x="10" y="10" width="300" height="160" rx="8" />
        <line x1="160" y1="10" x2="160" y2="170" />
        <circle cx="160" cy="90" r="28" />
        <rect x="10" y="45" width="42" height="90" />
        <rect x="268" y="45" width="42" height="90" />
      </g>

      {/* The goal the player is working toward. */}
      <rect
        x={attackingSide ? 6 : 306}
        y="66"
        width="8"
        height="48"
        rx="3"
        fill="var(--lime)"
        opacity="0.75"
      />

      {/* Opponents, spread around the ball carrier. */}
      {Array.from({ length: defenders }, (_, index) => {
        const angle = (index / defenders) * Math.PI * 2;
        return (
          <circle
            key={index}
            cx={200 + Math.cos(angle) * 42}
            cy={90 + Math.sin(angle) * 34}
            r="9"
            fill="rgba(255,122,61,0.75)"
          />
        );
      })}

      {/* The career player. */}
      <circle cx="200" cy="90" r="11" fill="var(--lime)" />
      <circle cx="200" cy="90" r="17" fill="none" stroke="var(--lime)" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
