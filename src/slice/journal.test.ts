import { describe, expect, it } from "vitest";

import { attributeKeys } from "@/engine";

import { scriptSliceActions, sliceScript, sliceSeed } from "./fixtures";
import {
  SLICE_SEASONS,
  attributeChanges,
  buildRun,
  conditionChanges,
  decisionImpact,
} from "./journal";

describe("slice journal", () => {
  it("records one entry per completed season", () => {
    const seed = sliceSeed();
    const run = buildRun(seed, scriptSliceActions(seed));

    expect(run.records).toHaveLength(SLICE_SEASONS);
    expect(run.complete).toBe(true);
    expect(run.state.history).toHaveLength(SLICE_SEASONS);

    for (const [index, record] of run.records.entries()) {
      expect(record.summary.index).toBe(index);
      expect(record.summary.year).toBe(2026 + index);
      expect(record.summary.age).toBe(16 + index);
      expect(record.decision.id.startsWith(`s${index}-`)).toBe(true);
    }
  });

  it("is not complete while the slice is still running", () => {
    const seed = sliceSeed();
    const actions = scriptSliceActions(seed, sliceScript({ seasons: 1 }));
    const run = buildRun(seed, actions);

    expect(run.records).toHaveLength(1);
    expect(run.complete).toBe(false);
  });

  it("rebuilds the same run from the same action log", () => {
    const seed = sliceSeed();
    const actions = scriptSliceActions(seed);

    expect(buildRun(seed, actions)).toEqual(buildRun(seed, actions));
  });

  it("captures the player on both sides of every season", () => {
    const seed = sliceSeed();
    const run = buildRun(seed, scriptSliceActions(seed));

    for (const record of run.records) {
      for (const key of attributeKeys) {
        expect(Number.isInteger(record.attributesBefore[key])).toBe(true);
        expect(Number.isInteger(record.attributesAfter[key])).toBe(true);
      }
    }

    // The end of one season is the start of the next.
    const [first, second] = run.records;
    expect(second?.attributesBefore).toEqual(first?.attributesAfter);
    expect(second?.conditionBefore).toEqual(first?.conditionAfter);
  });

  it("reports at least one attribute and one dynamic value that moved", () => {
    // An acceptance criterion of the slice: the player must see something
    // change and be told why.
    const seed = sliceSeed();
    const run = buildRun(seed, scriptSliceActions(seed, sliceScript({ perfect: true })));

    for (const record of run.records) {
      expect(attributeChanges(record).length).toBeGreaterThan(0);
      expect(conditionChanges(record).length).toBeGreaterThan(0);
    }
  });

  it("orders changes by size and reports the real deltas", () => {
    const seed = sliceSeed();
    const run = buildRun(seed, scriptSliceActions(seed, sliceScript({ perfect: true })));
    const record = run.records[0];
    expect(record).toBeDefined();

    const changes = attributeChanges(record!);
    for (const change of changes) {
      expect(change.delta).toBe(change.after - change.before);
      expect(change.delta).not.toBe(0);
    }

    const deltas = changes.map((change) => change.delta);
    expect([...deltas].sort((a, b) => b - a)).toEqual(deltas);
  });

  it("names an early choice that is still visible at the end", () => {
    // The slice must show that a decision mattered later, not just immediately.
    const seed = sliceSeed();
    const impact = decisionImpact(buildRun(seed, scriptSliceActions(seed)));

    expect(impact.kind).not.toBe("none");
    if (impact.kind === "transfer") {
      expect(impact.season).toBeLessThan(SLICE_SEASONS);
      expect(impact.clubId).toMatch(/^cl-/);
    }

    if (impact.kind === "focus") {
      expect(impact.season).toBeLessThan(SLICE_SEASONS);
      expect(impact.points).toBeGreaterThan(0);
    }
  });

  it("reports no impact for a run that has not finished a season", () => {
    const seed = sliceSeed();

    expect(decisionImpact(buildRun(seed, []))).toEqual({ kind: "none" });
  });

  it("refuses an action log that is not a legal career", () => {
    const seed = sliceSeed();

    expect(() =>
      buildRun(seed, [{ type: "chooseDecision", decisionId: "s0-not-real" }]),
    ).toThrow();
  });
});
