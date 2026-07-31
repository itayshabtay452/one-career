/**
 * Synthetic fixtures for slice tests.
 *
 * The scripted player is deterministic on purpose: a test seeded from
 * `Math.random` could not tell a real bug from an unlucky run.
 */

import {
  applyAction,
  createCareer,
  type CareerAction,
  type CareerSeed,
  type MomentChoice,
} from "@/engine";

import { SLICE_SEASONS, SLICE_START_YEAR } from "./journal";

const MOMENT_CHOICES: readonly MomentChoice[] = [
  "shoot",
  "pass",
  "dribble",
  "tackle",
];

export function sliceSeed(overrides: Partial<CareerSeed> = {}): CareerSeed {
  return {
    version: 1,
    seedText: "slice-run-0001",
    playerName: "Test Player",
    nationality: "Testland",
    roleFamily: "attack",
    startAge: 16,
    startYear: SLICE_START_YEAR,
    ...overrides,
  };
}

export type SliceScript = {
  /** Varies the decisions the scripted player takes. */
  variant: number;
  /** Executes every moment exactly as the prompt asks. */
  perfect: boolean;
  /** Seasons to play. Defaults to a full slice. */
  seasons: number;
};

export function sliceScript(overrides: Partial<SliceScript> = {}): SliceScript {
  return { variant: 0, perfect: false, seasons: SLICE_SEASONS, ...overrides };
}

/** Produces the action log for a scripted slice run. */
export function scriptSliceActions(
  seed: CareerSeed,
  script: SliceScript = sliceScript(),
): readonly CareerAction[] {
  let state = createCareer(seed);
  const actions: CareerAction[] = [];

  while (state.history.length < script.seasons && state.season.phase !== "ended") {
    const index = state.season.index;
    let action: CareerAction;

    if (state.season.phase === "decision") {
      const options = state.season.decisions.filter(
        (option) => option.kind !== "retire",
      );
      const pool = options.length > 0 ? options : state.season.decisions;
      const choice = pool[(script.variant + index) % pool.length];
      action = { type: "chooseDecision", decisionId: choice?.id ?? "" };
    } else if (state.season.phase === "moment") {
      const moment = state.season.moment;
      action = {
        type: "playMoment",
        input: script.perfect
          ? {
              choice: moment.expectedChoice,
              direction: moment.idealDirection,
              power: moment.idealPower,
              timing: 0,
            }
          : {
              choice: MOMENT_CHOICES[
                (script.variant + index) % MOMENT_CHOICES.length
              ] as MomentChoice,
              direction: ((script.variant + index) % 5) - 2,
              power: (script.variant * 23 + index * 17) % 101,
              timing: ((script.variant * 5 + index * 13) % 61) - 30,
            },
      };
    } else {
      action = { type: "advanceSeason" };
    }

    state = applyAction(state, action).state;
    actions.push(action);
  }

  return actions;
}

/** In-memory stand in for `window.localStorage`. */
export function fakeStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    size: () => values.size,
  };
}
