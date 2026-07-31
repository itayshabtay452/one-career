import { describe, expect, it } from "vitest";

import { InvalidSeedError, UnsupportedVersionError } from "./errors";
import { sampleSeed } from "./fixtures";
import { isSupportedSeed, parseCareerSeed } from "./seed";
import { SEED_VERSION } from "./types";

describe("seed parsing", () => {
  it("accepts and normalises a valid seed", () => {
    const seed = parseCareerSeed(sampleSeed({ playerName: "  Dana Levi  " }));

    expect(seed.version).toBe(SEED_VERSION);
    expect(seed.playerName).toBe("Dana Levi");
    expect(seed.roleFamily).toBe("attack");
    expect(Object.isFrozen(seed)).toBe(true);
  });

  it("rejects a seed from a newer build with an actionable message", () => {
    const error = catchError(() => parseCareerSeed(sampleSeed({ version: 2 as never })));

    expect(error).toBeInstanceOf(UnsupportedVersionError);
    expect((error as UnsupportedVersionError).code).toBe("UNSUPPORTED_SEED_VERSION");
    expect(error?.message).toContain("received 2");
    expect(error?.message).toContain("supports version 1");
    expect(error?.message).toContain("Upgrade the application");
  });

  it("rejects a missing version rather than assuming the current one", () => {
    const withoutVersion: Record<string, unknown> = { ...sampleSeed() };
    delete withoutVersion.version;

    expect(() => parseCareerSeed(withoutVersion)).toThrow(UnsupportedVersionError);
  });

  it("rejects seed text outside the canonical alphabet", () => {
    // Accented and Hebrew text can be encoded more than one way, so the same
    // visible seed could hash differently on two devices.
    for (const seedText of ["café-run", "ריצה-01", "has space", "sh", "a".repeat(65)]) {
      expect(() => parseCareerSeed(sampleSeed({ seedText }))).toThrow(InvalidSeedError);
    }

    expect(() => parseCareerSeed(sampleSeed({ seedText: "Valid_seed-01" }))).not.toThrow();
  });

  it("rejects an unplayable role family", () => {
    const error = catchError(() =>
      parseCareerSeed(sampleSeed({ roleFamily: "goalkeeper" as never })),
    );

    expect(error).toBeInstanceOf(InvalidSeedError);
    expect(error?.message).toContain("Goalkeepers are not playable");
  });

  it("rejects out of range and non integer ages", () => {
    expect(() => parseCareerSeed(sampleSeed({ startAge: 12 }))).toThrow(InvalidSeedError);
    expect(() => parseCareerSeed(sampleSeed({ startAge: 25 }))).toThrow(InvalidSeedError);
    expect(() => parseCareerSeed(sampleSeed({ startAge: 16.5 }))).toThrow(InvalidSeedError);
  });

  it("rejects empty identity fields", () => {
    expect(() => parseCareerSeed(sampleSeed({ playerName: "   " }))).toThrow(
      InvalidSeedError,
    );
    expect(() => parseCareerSeed(sampleSeed({ nationality: "" }))).toThrow(
      InvalidSeedError,
    );
  });

  it("rejects values that are not objects", () => {
    for (const value of [null, undefined, 42, "seed", [sampleSeed()]]) {
      expect(() => parseCareerSeed(value)).toThrow(InvalidSeedError);
    }
  });

  it("reports support without throwing", () => {
    expect(isSupportedSeed(sampleSeed())).toBe(true);
    expect(isSupportedSeed(sampleSeed({ version: 99 as never }))).toBe(false);
    expect(isSupportedSeed(null)).toBe(false);
  });
});

function catchError(run: () => unknown): Error | null {
  try {
    run();
    return null;
  } catch (error) {
    return error as Error;
  }
}
