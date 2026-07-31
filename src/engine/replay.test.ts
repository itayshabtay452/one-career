import { describe, expect, it } from "vitest";

import { applyAction, createCareer, replayCareer } from "./career";
import { InvalidActionError, InvalidStateError, UnsupportedVersionError } from "./errors";
import {
  SEED_TEXTS,
  playScriptedCareer,
  sampleSeed,
  scriptStyle,
} from "./fixtures";
import { loadCareerSave, parseCareerSave, toCareerSave } from "./persistence";
import { STATE_VERSION } from "./types";

const styles = [
  scriptStyle({ variant: 0 }),
  scriptStyle({ variant: 3 }),
  scriptStyle({ variant: 5, retiresWhenOffered: true }),
  scriptStyle({ perfectExecution: true }),
];

describe("replay determinism", () => {
  it("produces an identical career for the same seed and action log", () => {
    for (const seedText of SEED_TEXTS) {
      for (const style of styles) {
        const seed = sampleSeed({ seedText });
        const first = playScriptedCareer(seed, style);
        const second = playScriptedCareer(seed, style);

        expect(second.state).toEqual(first.state);
        expect(second.events).toEqual(first.events);
        expect(second.actions).toEqual(first.actions);
      }
    }
  });

  it("rebuilds the exact same state when the action log is replayed", () => {
    for (const seedText of SEED_TEXTS) {
      const seed = sampleSeed({ seedText });
      const run = playScriptedCareer(seed, scriptStyle({ variant: 2 }));
      const replayed = replayCareer(seed, run.state.actionLog);

      expect(replayed.state).toEqual(run.state);
      expect(replayed.events).toEqual(run.events);
    }
  });

  it("survives a round trip through JSON", () => {
    const seed = sampleSeed({ seedText: "hotel-run-08" });
    const run = playScriptedCareer(seed, scriptStyle({ variant: 4 }));

    const restored = replayCareer(
      seed,
      JSON.parse(JSON.stringify(run.state.actionLog)),
    );

    expect(restored.state).toEqual(run.state);
  });

  it("gives different seeds different careers", () => {
    // Without this, an engine that ignored its seed entirely would still pass
    // every determinism test above.
    const style = scriptStyle({ variant: 1 });
    const fingerprints = SEED_TEXTS.map((seedText) => {
      const run = playScriptedCareer(sampleSeed({ seedText }), style);
      return JSON.stringify({
        attributes: run.state.player.attributes,
        history: run.state.history,
      });
    });

    expect(new Set(fingerprints).size).toBe(SEED_TEXTS.length);
  });

  it("keeps the identity fields out of the random draws", () => {
    // Two players with different names on one Daily seed must face exactly the
    // same world, decisions and moments.
    const base = playScriptedCareer(
      sampleSeed({ seedText: "alpha-run-01", playerName: "Dana" }),
      scriptStyle(),
    );
    const other = playScriptedCareer(
      sampleSeed({ seedText: "alpha-run-01", playerName: "Noam", nationality: "Elsewhere" }),
      scriptStyle(),
    );

    expect(other.state.player.attributes).toEqual(base.state.player.attributes);
    expect(other.state.history).toEqual(base.state.history);
  });
});

describe("save format", () => {
  it("stores only the seed and the action log", () => {
    const run = playScriptedCareer(sampleSeed(), scriptStyle({ variant: 2 }));
    const save = toCareerSave(run.state);

    expect(Object.keys(save).sort()).toEqual(["actionLog", "seed", "version"]);
    expect(save.version).toBe(STATE_VERSION);
  });

  it("loads a saved career back to the same state", () => {
    for (const seedText of SEED_TEXTS.slice(0, 4)) {
      const run = playScriptedCareer(sampleSeed({ seedText }), scriptStyle({ variant: 1 }));
      const serialised = JSON.stringify(toCareerSave(run.state));
      const loaded = loadCareerSave(JSON.parse(serialised));

      expect(loaded.state).toEqual(run.state);
    }
  });

  it("loads a career that is still mid season", () => {
    const seed = sampleSeed({ seedText: "delta-run-04" });
    let state = createCareer(seed);
    state = applyAction(state, {
      type: "chooseDecision",
      decisionId: state.season.decisions[0]?.id ?? "",
    }).state;

    const loaded = loadCareerSave(JSON.parse(JSON.stringify(toCareerSave(state))));

    expect(loaded.state).toEqual(state);
    expect(loaded.state.season.phase).toBe("moment");
  });

  it("rejects a save from a newer build instead of guessing its rules", () => {
    const save = toCareerSave(playScriptedCareer(sampleSeed()).state);
    const error = catchError(() => parseCareerSave({ ...save, version: 2 }));

    expect(error).toBeInstanceOf(UnsupportedVersionError);
    expect(error?.message).toContain("received 2");
    expect(error?.message).toContain("Upgrade the application");
  });

  it("rejects an older save with no migration available", () => {
    const save = toCareerSave(playScriptedCareer(sampleSeed()).state);

    // Version 0 is below the first released format, so no upgrade path exists.
    expect(() => parseCareerSave({ ...save, version: 0 })).toThrow(InvalidStateError);
  });

  it("rejects malformed saves with a message that points at the problem", () => {
    const save = toCareerSave(playScriptedCareer(sampleSeed()).state);

    expect(() => parseCareerSave(null)).toThrow(InvalidStateError);
    expect(() => parseCareerSave({ ...save, actionLog: "nope" })).toThrow(
      InvalidStateError,
    );
    expect(() =>
      parseCareerSave({ ...save, actionLog: [{ type: "teleport" }] }),
    ).toThrow(InvalidStateError);
    expect(() =>
      parseCareerSave({ ...save, actionLog: [{ type: "chooseDecision" }] }),
    ).toThrow(InvalidStateError);
  });

  it("rejects an action log that breaks the rules", () => {
    const run = playScriptedCareer(sampleSeed(), scriptStyle({ variant: 2 }));
    const save = toCareerSave(run.state);

    // Someone edited the log to claim a decision that was never offered.
    const illegal = {
      ...save,
      actionLog: [{ type: "chooseDecision", decisionId: "s0-transfer-cl-aurora" }],
    };

    expect(() => loadCareerSave(illegal)).toThrow(InvalidActionError);
  });

  it("usually invalidates the rest of the log when a moment is edited", () => {
    // Decision option ids depend on the career state, so an edited moment
    // changes development, which changes which offers exist later, which makes
    // the logged decision ids unreachable. Tamper resistance in practice comes
    // largely from this coupling rather than from a signature.
    const run = playScriptedCareer(sampleSeed(), scriptStyle({ variant: 2 }));
    const save = toCareerSave(run.state);

    const momentIndex = save.actionLog.findIndex(
      (action) => action.type === "playMoment",
    );
    const edited = save.actionLog.map((action, index) =>
      index === momentIndex
        ? {
            type: "playMoment" as const,
            input: { choice: "shoot" as const, direction: 0, power: 50, timing: 0 },
          }
        : action,
    );

    expect(() => loadCareerSave({ ...save, actionLog: edited })).toThrow(
      InvalidActionError,
    );
  });

  it("accepts an edited log that stays internally consistent, and says so", () => {
    // This is the limit of what replay proves, and it is worth stating rather
    // than assuming. A replay shows a log is CONSISTENT WITH THE RULES; it does
    // not show the player actually made those inputs. Edit the last moment,
    // with nothing after it to contradict, and the save loads with a different
    // result. Authenticity of a ranked run must therefore come from the server:
    // per REVIEW.md the client is not the authority on a graded result.
    const run = playScriptedCareer(sampleSeed(), scriptStyle({ variant: 2 }));
    const save = toCareerSave(run.state);

    const momentIndex = save.actionLog.findIndex(
      (action) => action.type === "playMoment",
    );
    const shortened = [
      ...save.actionLog.slice(0, momentIndex),
      {
        type: "playMoment" as const,
        input: { choice: "shoot" as const, direction: 0, power: 50, timing: 0 },
      },
    ];

    const loaded = loadCareerSave({ ...save, actionLog: shortened });

    expect(loaded.state.season.phase).toBe("summary");
    expect(loaded.state.season.momentResult?.score).not.toBe(
      run.state.history[0]?.momentScore,
    );
  });

  it("rejects a save whose seed is no longer supported", () => {
    const save = toCareerSave(playScriptedCareer(sampleSeed()).state);

    expect(() =>
      parseCareerSave({ ...save, seed: { ...save.seed, version: 7 } }),
    ).toThrow(UnsupportedVersionError);
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
