import { describe, expect, it } from "vitest";

import { createRng } from "./rng";

describe("deterministic rng", () => {
  it("returns the same sequence for the same address", () => {
    const first = createRng("alpha-run-01", "moment", 3);
    const second = createRng("alpha-run-01", "moment", 3);

    const left = Array.from({ length: 32 }, () => first.nextUint32());
    const right = Array.from({ length: 32 }, () => second.nextUint32());

    expect(left).toEqual(right);
  });

  it("produces uint32 values only", () => {
    const rng = createRng("alpha-run-01", "academy", 0);

    for (let i = 0; i < 500; i += 1) {
      const value = rng.nextUint32();
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it("separates streams by seed, channel and index", () => {
    const head = (seed: string, channel: "moment" | "decisions", index: number) =>
      Array.from({ length: 8 }, () => 0).map(() =>
        createRng(seed, channel, index).nextUint32(),
      )[0];

    const base = head("alpha-run-01", "moment", 0);

    expect(head("bravo-run-02", "moment", 0)).not.toBe(base);
    expect(head("alpha-run-01", "decisions", 0)).not.toBe(base);
    expect(head("alpha-run-01", "moment", 1)).not.toBe(base);
  });

  it("keeps intBelow inside the bound and unbiased enough to trust", () => {
    const rng = createRng("alpha-run-01", "world", 0);
    const buckets = [0, 0, 0, 0, 0, 0];
    const draws = 60_000;

    for (let i = 0; i < draws; i += 1) {
      const value = rng.intBelow(buckets.length);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(buckets.length);
      buckets[value] += 1;
    }

    const expected = draws / buckets.length;
    for (const count of buckets) {
      // A 10% band is loose enough never to flake and tight enough to catch a
      // modulo bias, which would skew the low buckets by far more than that.
      expect(Math.abs(count - expected)).toBeLessThan(expected * 0.1);
    }
  });

  it("treats intBetween as inclusive on both ends", () => {
    const rng = createRng("charlie_run_03", "development", 2);
    const seen = new Set<number>();

    for (let i = 0; i < 2000; i += 1) {
      const value = rng.intBetween(-2, 2);
      expect(value).toBeGreaterThanOrEqual(-2);
      expect(value).toBeLessThanOrEqual(2);
      seen.add(value);
    }

    expect([...seen].sort((a, b) => a - b)).toEqual([-2, -1, 0, 1, 2]);
  });

  it("rejects impossible bounds instead of guessing", () => {
    const rng = createRng("alpha-run-01", "moment", 0);

    expect(() => rng.intBelow(0)).toThrow(RangeError);
    expect(() => rng.intBelow(2.5)).toThrow(RangeError);
    expect(() => rng.intBetween(5, 1)).toThrow(RangeError);
    expect(() => rng.pick([])).toThrow(RangeError);
    expect(() => createRng("alpha-run-01", "moment", -1)).toThrow(RangeError);
  });

  it("refuses a bound wider than one draw instead of looping forever", () => {
    // Above 2^32 the rejection limit computes to 0, so every draw would be
    // rejected and the sampling loop would never terminate.
    const rng = createRng("alpha-run-01", "moment", 0);

    expect(() => rng.intBelow(0x100000000)).not.toThrow();
    expect(() => rng.intBelow(0x100000001)).toThrow(RangeError);
    expect(() => rng.intBetween(0, 0x100000000)).toThrow(RangeError);
    expect(() => rng.intBetween(-0x80000000, 0x80000001)).toThrow(RangeError);
  });

  it("is stable across builds", () => {
    // A golden vector. If this changes, every existing seed produces a
    // different career, which is a breaking change that needs a version bump.
    const rng = createRng("one-career-golden", "moment", 0);
    const values = Array.from({ length: 6 }, () => rng.nextUint32());

    expect(values).toEqual([
      1162912656, 1719415448, 178035757, 2326186589, 498366485, 2179824802,
    ]);
  });
});
