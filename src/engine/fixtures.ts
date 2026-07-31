/**
 * Synthetic fixtures for tests.
 *
 * Everything here is invented. No real player, club or competition data is used
 * anywhere in the engine or its tests.
 *
 * The scripted players below are fully deterministic on purpose: a test that
 * seeded itself from `Math.random` could not tell a real determinism bug from
 * an unlucky run.
 */

import { applyAction, createCareer } from "./career";
import {
  SEED_VERSION,
  type CareerAction,
  type CareerEvent,
  type CareerSeed,
  type CareerState,
  type MomentChoice,
  type MomentInput,
} from "./types";

const MOMENT_CHOICES: readonly MomentChoice[] = [
  "shoot",
  "pass",
  "dribble",
  "tackle",
];

/** A valid baseline seed. Override single fields to build invalid variants. */
export function sampleSeed(overrides: Partial<CareerSeed> = {}): CareerSeed {
  return {
    version: SEED_VERSION,
    seedText: "daily-2026-07-31",
    playerName: "Test Player",
    nationality: "Testland",
    roleFamily: "attack",
    startAge: 16,
    startYear: 2026,
    ...overrides,
  };
}

/** Seed texts used by the replay tests. Chosen by hand, not generated. */
export const SEED_TEXTS: readonly string[] = [
  "alpha-run-01",
  "bravo-run-02",
  "charlie_run_03",
  "delta-run-04",
  "echo-run-05",
  "foxtrot-run-06",
  "golf-run-07",
  "hotel-run-08",
];

export type ScriptStyle = {
  /** Varies the choices a scripted player makes. */
  variant: number;
  /** Whether the scripted player takes the retire option when offered. */
  retiresWhenOffered: boolean;
  /** When true, the scripted player executes every moment perfectly. */
  perfectExecution: boolean;
};

export function scriptStyle(overrides: Partial<ScriptStyle> = {}): ScriptStyle {
  return { variant: 0, retiresWhenOffered: false, perfectExecution: false, ...overrides };
}

function scriptedMomentInput(state: CareerState, style: ScriptStyle): MomentInput {
  const moment = state.season.moment;
  const index = state.season.index;

  if (style.perfectExecution) {
    return {
      choice: moment.expectedChoice,
      direction: moment.idealDirection,
      power: moment.idealPower,
      timing: 0,
    };
  }

  const step = style.variant + index;
  return {
    choice: MOMENT_CHOICES[step % MOMENT_CHOICES.length] as MomentChoice,
    direction: (step % 5) - 2,
    power: (style.variant * 17 + index * 13) % 101,
    timing: ((style.variant * 7 + index * 11) % 41) - 20,
  };
}

function scriptedDecisionId(state: CareerState, style: ScriptStyle): string {
  const options = state.season.decisions;
  const selectable = style.retiresWhenOffered
    ? options
    : options.filter((option) => option.kind !== "retire");

  // A career with only a retire option left has nowhere else to go.
  const pool = selectable.length > 0 ? selectable : options;
  const choice = pool[(style.variant + state.season.index) % pool.length];
  if (!choice) {
    throw new Error("A season must always offer at least one decision.");
  }

  return choice.id;
}

export type ScriptedRun = {
  state: CareerState;
  events: readonly CareerEvent[];
  actions: readonly CareerAction[];
};

/**
 * Plays a full career with a scripted player and returns the result.
 *
 * `stepLimit` guards the test suite against an engine bug that never reaches an
 * end state; it is not a game rule.
 */
export function playScriptedCareer(
  seedInput: unknown,
  style: ScriptStyle = scriptStyle(),
  stepLimit = 500,
): ScriptedRun {
  let state = createCareer(seedInput);
  const events: CareerEvent[] = [];
  const actions: CareerAction[] = [];

  for (let step = 0; step < stepLimit; step += 1) {
    if (state.season.phase === "ended") {
      return { state, events, actions };
    }

    let action: CareerAction;
    switch (state.season.phase) {
      case "decision":
        action = { type: "chooseDecision", decisionId: scriptedDecisionId(state, style) };
        break;
      case "moment":
        action = { type: "playMoment", input: scriptedMomentInput(state, style) };
        break;
      default:
        action = { type: "advanceSeason" };
        break;
    }

    const result = applyAction(state, action);
    state = result.state;
    events.push(...result.events);
    actions.push(action);
  }

  throw new Error(
    `A scripted career did not reach an end state within ${stepLimit} steps.`,
  );
}
