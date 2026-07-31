import { describe, expect, it } from "vitest";

import { computeLegacyInput, type LegacyInput } from "@/engine";

import { scriptSliceActions, sliceScript, sliceSeed } from "./fixtures";
import { buildRun } from "./journal";
import { computeProvisionalLegacy } from "./legacy";

function legacyInput(overrides: Partial<LegacyInput> = {}): LegacyInput {
  return {
    seasonsPlayed: 3,
    decisiveMoments: 0,
    poorMoments: 0,
    peakRating: 50,
    averageRating: 50,
    finalReputation: 20,
    totalGrowth: 6,
    clubsPlayedFor: 1,
    ...overrides,
  };
}

describe("provisional legacy", () => {
  it("stays inside the product scale", () => {
    const worst = computeProvisionalLegacy(
      legacyInput({
        averageRating: 0,
        finalReputation: 0,
        totalGrowth: 0,
        poorMoments: 3,
      }),
    );
    const best = computeProvisionalLegacy(
      legacyInput({
        averageRating: 100,
        finalReputation: 100,
        totalGrowth: 20,
        decisiveMoments: 3,
      }),
    );

    expect(worst.score).toBe(0);
    expect(best.score).toBe(1000);
    expect(best.score).toBeGreaterThan(worst.score);
  });

  it("rewards a better career with a better score", () => {
    const weak = computeProvisionalLegacy(legacyInput({ averageRating: 40 }));
    const strong = computeProvisionalLegacy(legacyInput({ averageRating: 80 }));

    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it("keeps every part on its own 0 to 100 scale", () => {
    const legacy = computeProvisionalLegacy(
      legacyInput({ totalGrowth: 99, decisiveMoments: 9, poorMoments: 9 }),
    );

    for (const value of Object.values(legacy.parts)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("never divides by zero on an empty career", () => {
    const legacy = computeProvisionalLegacy(
      legacyInput({ seasonsPlayed: 0, averageRating: 0, finalReputation: 0, totalGrowth: 0 }),
    );

    expect(Number.isFinite(legacy.score)).toBe(true);
    expect(legacy.score).toBe(100);
  });

  it("names a title band for every score", () => {
    expect(computeProvisionalLegacy(legacyInput({ averageRating: 100, finalReputation: 100, totalGrowth: 20, decisiveMoments: 3 })).titleKey).toBe(
      "breakthrough",
    );
    expect(computeProvisionalLegacy(legacyInput({ averageRating: 55, finalReputation: 45 })).titleKey).toBe(
      "steady",
    );
    expect(
      computeProvisionalLegacy(
        legacyInput({ averageRating: 10, finalReputation: 5, totalGrowth: 0, poorMoments: 3 }),
      ).titleKey,
    ).toBe("raw");
  });

  it("scores a real slice run", () => {
    const seed = sliceSeed();
    const sloppy = buildRun(seed, scriptSliceActions(seed));
    const perfect = buildRun(seed, scriptSliceActions(seed, sliceScript({ perfect: true })));

    const sloppyScore = computeProvisionalLegacy(computeLegacyInput(sloppy.state)).score;
    const perfectScore = computeProvisionalLegacy(computeLegacyInput(perfect.state)).score;

    expect(perfectScore).toBeGreaterThan(sloppyScore);
    expect(perfectScore).toBeLessThanOrEqual(1000);
  });
});
