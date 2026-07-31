import { describe, expect, it } from "vitest";

import {
  MAX_CAREER_AGE,
  MAX_RETIREMENT_AGE,
  MIN_RETIREMENT_AGE,
  RETIREMENT_CHOICE_AGE,
  applyAction,
  computeLegacyInput,
  createCareer,
} from "./career";
import { InvalidActionError } from "./errors";
import { SEED_TEXTS, playScriptedCareer, sampleSeed, scriptStyle } from "./fixtures";
import { attributeKeys, type CareerState } from "./types";
import { findClub, syntheticWorld } from "./world";

function startCareer(seedText = "alpha-run-01"): CareerState {
  return createCareer(sampleSeed({ seedText }));
}

describe("career creation", () => {
  it("starts a playable first season", () => {
    const state = startCareer();

    expect(state.status).toBe("active");
    expect(state.season.index).toBe(0);
    expect(state.season.phase).toBe("decision");
    expect(state.season.year).toBe(2026);
    expect(state.player.age).toBe(16);
    expect(state.history).toHaveLength(0);
    expect(state.actionLog).toHaveLength(0);
    expect(findClub(syntheticWorld, state.season.clubId)).not.toBeNull();
  });

  it("keeps every generated value inside its documented range", () => {
    for (const seedText of ["alpha-run-01", "bravo-run-02", "charlie_run_03"]) {
      const state = startCareer(seedText);

      for (const key of attributeKeys) {
        expect(state.player.attributes[key]).toBeGreaterThanOrEqual(1);
        expect(state.player.attributes[key]).toBeLessThanOrEqual(99);
      }

      const { fitness, morale, sharpness, reputation } = state.player.condition;
      for (const value of [fitness, morale, sharpness, reputation]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }

      expect(state.player.potential.high).toBeGreaterThanOrEqual(
        state.player.potential.low,
      );

      const moment = state.season.moment;
      expect(moment.pressure).toBeGreaterThanOrEqual(0);
      expect(moment.pressure).toBeLessThanOrEqual(100);
      expect(Math.abs(moment.idealDirection)).toBeLessThanOrEqual(2);
      expect(moment.timingWindow).toBeGreaterThanOrEqual(6);
    }
  });

  it("never starts a 16 year old at a top club", () => {
    const ranked = [...syntheticWorld.clubs].sort((a, b) => b.strength - a.strength);
    const strongest = ranked[0]?.id;

    for (const seedText of ["alpha-run-01", "bravo-run-02", "delta-run-04"]) {
      expect(startCareer(seedText).season.clubId).not.toBe(strongest);
    }
  });

  it("does not offer retirement to a teenager", () => {
    const kinds = startCareer().season.decisions.map((option) => option.kind);
    expect(kinds).not.toContain("retire");
  });
});

describe("season flow", () => {
  it("moves decision to moment to summary and into the next season", () => {
    const state = startCareer();
    const decisionId = state.season.decisions[0]?.id ?? "";

    const afterDecision = applyAction(state, { type: "chooseDecision", decisionId });
    expect(afterDecision.state.season.phase).toBe("moment");
    expect(afterDecision.events[0]).toMatchObject({ type: "decisionApplied" });

    const afterMoment = applyAction(afterDecision.state, {
      type: "playMoment",
      input: { choice: "shoot", direction: 0, power: 60, timing: 0 },
    });
    expect(afterMoment.state.season.phase).toBe("summary");
    expect(afterMoment.state.season.momentResult).not.toBeNull();

    const afterAdvance = applyAction(afterMoment.state, { type: "advanceSeason" });
    expect(afterAdvance.state.season.index).toBe(1);
    expect(afterAdvance.state.season.phase).toBe("decision");
    expect(afterAdvance.state.player.age).toBe(17);
    expect(afterAdvance.state.history).toHaveLength(1);
    expect(afterAdvance.events[0]).toMatchObject({ type: "seasonCompleted" });
  });

  it("never mutates the state it was given", () => {
    const state = startCareer();
    const snapshot = JSON.stringify(state);

    applyAction(state, {
      type: "chooseDecision",
      decisionId: state.season.decisions[0]?.id ?? "",
    });

    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it("records every applied action in order", () => {
    const run = playScriptedCareer(sampleSeed(), scriptStyle({ variant: 2 }));

    expect(run.state.actionLog).toEqual(run.actions);
    expect(run.actions.length).toBeGreaterThan(10);
  });
});

describe("rejected actions", () => {
  it("refuses an action that does not fit the current phase", () => {
    const state = startCareer();

    expect(() => applyAction(state, { type: "advanceSeason" })).toThrow(
      InvalidActionError,
    );
    expect(() =>
      applyAction(state, {
        type: "playMoment",
        input: { choice: "shoot", direction: 0, power: 50, timing: 0 },
      }),
    ).toThrow(InvalidActionError);
  });

  it("refuses an unknown decision and lists what was available", () => {
    const state = startCareer();
    let message = "";

    try {
      applyAction(state, { type: "chooseDecision", decisionId: "s0-not-real" });
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain('Unknown decision "s0-not-real"');
    expect(message).toContain("Available:");
  });

  it("refuses moment input that is not a bounded integer", () => {
    const state = startCareer();
    const inMoment = applyAction(state, {
      type: "chooseDecision",
      decisionId: state.season.decisions[0]?.id ?? "",
    }).state;

    const invalidInputs = [
      { choice: "header", direction: 0, power: 50, timing: 0 },
      { choice: "shoot", direction: 9, power: 50, timing: 0 },
      { choice: "shoot", direction: 0, power: 101, timing: 0 },
      { choice: "shoot", direction: 0, power: 50, timing: 400 },
      { choice: "shoot", direction: 0.5, power: 50, timing: 0 },
      { choice: "shoot", direction: 0, power: Number.NaN, timing: 0 },
    ];

    for (const input of invalidInputs) {
      expect(() =>
        applyAction(inMoment, { type: "playMoment", input: input as never }),
      ).toThrow(InvalidActionError);
    }
  });

  it("refuses every action once the career has ended", () => {
    const run = playScriptedCareer(sampleSeed(), scriptStyle({ variant: 1 }));

    expect(run.state.season.phase).toBe("ended");
    expect(() => applyAction(run.state, { type: "advanceSeason" })).toThrow(
      InvalidActionError,
    );
  });

  it("refuses an unknown action type", () => {
    const state = startCareer();

    expect(() =>
      applyAction(state, { type: "signContract" } as never),
    ).toThrow(InvalidActionError);
  });
});

describe("career length and retirement", () => {
  it("offers retirement only from the retirement age", () => {
    let state = startCareer();
    const offers: Array<{ age: number; offered: boolean }> = [];

    while (state.season.phase !== "ended") {
      if (state.season.phase === "decision") {
        offers.push({
          age: state.player.age,
          offered: state.season.decisions.some((option) => option.kind === "retire"),
        });
      }

      state = applyAction(state, nextActionFor(state)).state;
    }

    for (const offer of offers) {
      expect(offer.offered).toBe(offer.age >= RETIREMENT_CHOICE_AGE);
    }
  });

  it("ends the career at the age limit even if the player never retires", () => {
    const run = playScriptedCareer(
      sampleSeed(),
      scriptStyle({ retiresWhenOffered: false }),
    );

    expect(run.state.status).toBe("retired");
    expect(run.state.player.age).toBe(run.state.retirementAge + 1);
    expect(run.events.at(-1)).toEqual({ type: "careerEnded", reason: "ageLimit" });
  });

  it("draws a varying retirement age from the seed", () => {
    const ages = SEED_TEXTS.map(
      (seedText) => createCareer(sampleSeed({ seedText })).retirementAge,
    );

    for (const age of ages) {
      expect(age).toBeGreaterThanOrEqual(MIN_RETIREMENT_AGE);
      expect(age).toBeLessThanOrEqual(MAX_RETIREMENT_AGE);
      expect(age).toBeLessThanOrEqual(MAX_CAREER_AGE);
    }

    // Retirement is meant to vary between careers, not be a constant.
    expect(new Set(ages).size).toBeGreaterThan(1);
  });

  it("ends the career immediately when the player chooses to retire", () => {
    const run = playScriptedCareer(
      sampleSeed(),
      scriptStyle({ retiresWhenOffered: true }),
    );

    expect(run.state.status).toBe("retired");
    expect(run.state.player.age).toBeLessThan(MAX_CAREER_AGE);
    expect(run.events.at(-1)).toEqual({ type: "careerEnded", reason: "retired" });
  });

  it("produces a career of a believable length", () => {
    for (const seedText of ["alpha-run-01", "echo-run-05", "golf-run-07"]) {
      const run = playScriptedCareer(sampleSeed({ seedText }));

      // 19 to 22 seasons, matching the overlap of the two ranges in the
      // product spec. See ADR-003.
      expect(run.state.history.length).toBeGreaterThanOrEqual(19);
      expect(run.state.history.length).toBeLessThanOrEqual(22);
    }
  });
});

describe("moment resolution", () => {
  it("rewards correct execution over guessing", () => {
    const perfect = playScriptedCareer(
      sampleSeed(),
      scriptStyle({ perfectExecution: true }),
    );
    const sloppy = playScriptedCareer(sampleSeed(), scriptStyle({ variant: 3 }));

    const average = (run: typeof perfect) =>
      run.state.history.reduce((total, season) => total + season.momentScore, 0) /
      run.state.history.length;

    expect(average(perfect)).toBeGreaterThan(average(sloppy));
  });

  it("names the factor that moved the score the most", () => {
    const state = startCareer();
    const inMoment = applyAction(state, {
      type: "chooseDecision",
      decisionId: state.season.decisions[0]?.id ?? "",
    }).state;
    const moment = inMoment.season.moment;

    const wrongChoice = applyAction(inMoment, {
      type: "playMoment",
      input: {
        choice: moment.expectedChoice === "shoot" ? "tackle" : "shoot",
        direction: moment.idealDirection,
        power: moment.idealPower,
        timing: 0,
      },
    }).state.season.momentResult;

    expect(wrongChoice?.decidingFactor).toBe("choice");
  });

  it("keeps luck independent of what the player did", () => {
    const state = startCareer();
    const inMoment = applyAction(state, {
      type: "chooseDecision",
      decisionId: state.season.decisions[0]?.id ?? "",
    }).state;

    const play = (power: number) =>
      applyAction(inMoment, {
        type: "playMoment",
        input: { choice: "shoot", direction: 0, power, timing: 0 },
      }).state.season.momentResult?.variance;

    expect(play(10)).toBe(play(90));
  });

  it("keeps the score inside 0..100 for extreme input", () => {
    const state = startCareer();
    const inMoment = applyAction(state, {
      type: "chooseDecision",
      decisionId: state.season.decisions[0]?.id ?? "",
    }).state;

    for (const input of [
      { choice: "tackle" as const, direction: -2, power: 0, timing: -100 },
      { choice: "shoot" as const, direction: 2, power: 100, timing: 100 },
    ]) {
      const result = applyAction(inMoment, { type: "playMoment", input }).state.season
        .momentResult;

      expect(result?.score).toBeGreaterThanOrEqual(0);
      expect(result?.score).toBeLessThanOrEqual(100);
    }
  });
});

describe("legacy inputs", () => {
  it("reports raw career facts without scoring them", () => {
    const run = playScriptedCareer(sampleSeed(), scriptStyle({ perfectExecution: true }));
    const legacy = computeLegacyInput(run.state);

    expect(legacy.seasonsPlayed).toBe(run.state.history.length);
    expect(legacy.decisiveMoments + legacy.poorMoments).toBeLessThanOrEqual(
      legacy.seasonsPlayed,
    );
    expect(legacy.peakRating).toBeGreaterThanOrEqual(legacy.averageRating);
    expect(legacy.clubsPlayedFor).toBeGreaterThanOrEqual(1);
    expect(legacy.finalReputation).toBe(run.state.player.condition.reputation);
  });

  it("handles a career that ended before its first season closed", () => {
    const legacy = computeLegacyInput(startCareer());

    expect(legacy.seasonsPlayed).toBe(0);
    expect(legacy.averageRating).toBe(0);
    expect(legacy.clubsPlayedFor).toBe(0);
  });
});

function nextActionFor(state: CareerState) {
  if (state.season.phase === "decision") {
    const option =
      state.season.decisions.find((candidate) => candidate.kind !== "retire") ??
      state.season.decisions[0];
    return { type: "chooseDecision" as const, decisionId: option?.id ?? "" };
  }

  if (state.season.phase === "moment") {
    return {
      type: "playMoment" as const,
      input: { choice: "shoot" as const, direction: 0, power: 60, timing: 0 },
    };
  }

  return { type: "advanceSeason" as const };
}
