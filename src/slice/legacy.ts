/**
 * Provisional Legacy score for the vertical slice.
 *
 * ADR-003 keeps scoring out of the engine: the engine reports facts, and the
 * real Legacy formula is defined together with game balancing. The slice still
 * needs an end screen, so this is a deliberately simple stand in built from the
 * weights in `docs/PRODUCT.md`, computed in the presentation layer and labelled
 * provisional everywhere it is shown.
 *
 * It must not be treated as the product formula, and nothing ranked may depend
 * on it.
 */

import type { LegacyInput } from "@/engine";

/** Weights from the product spec, in percent. They sum to 100. */
const WEIGHTS = {
  performance: 30,
  achievements: 25,
  development: 20,
  moments: 15,
  consistency: 10,
} as const;

export type LegacyTitleKey = "breakthrough" | "steady" | "raw";

export type ProvisionalLegacy = {
  /** 0 to 1000, matching the scale in the product spec. */
  score: number;
  titleKey: LegacyTitleKey;
  /** Each part on its own 0 to 100 scale, so the end screen can explain itself. */
  parts: Readonly<{
    performance: number;
    achievements: number;
    development: number;
    moments: number;
    consistency: number;
  }>;
};

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }

  return value > max ? max : value;
}

export function computeProvisionalLegacy(input: LegacyInput): ProvisionalLegacy {
  const seasons = Math.max(1, input.seasonsPlayed);

  const parts = {
    performance: clamp(input.averageRating, 0, 100),
    achievements: clamp(input.finalReputation, 0, 100),
    // A slice season grows a few attribute points, so 12 points is a strong run.
    development: clamp(Math.round((input.totalGrowth * 100) / 12), 0, 100),
    moments: clamp(Math.round((input.decisiveMoments * 100) / seasons), 0, 100),
    consistency: clamp(100 - Math.round((input.poorMoments * 100) / seasons), 0, 100),
  } as const;

  const weighted =
    parts.performance * WEIGHTS.performance +
    parts.achievements * WEIGHTS.achievements +
    parts.development * WEIGHTS.development +
    parts.moments * WEIGHTS.moments +
    parts.consistency * WEIGHTS.consistency;

  // Each part is 0..100 and the weights sum to 100, so `weighted` is 0..10000.
  // Dividing by 10 puts the result on the 0..1000 scale the product spec uses.
  const score = clamp(Math.round(weighted / 10), 0, 1000);

  return {
    score,
    titleKey: titleFor(score),
    parts,
  };
}

function titleFor(score: number): LegacyTitleKey {
  if (score >= 650) {
    return "breakthrough";
  }

  return score >= 400 ? "steady" : "raw";
}
