import { describe, expect, it } from "vitest";

import { applyAction, createCareer, toCareerSave } from "@/engine";

import { fakeStorage, scriptSliceActions, sliceSeed } from "./fixtures";
import { buildRun } from "./journal";
import {
  SAVE_KEY,
  clearRun,
  createSliceSeed,
  generateSeedText,
  loadRun,
  saveRun,
} from "./storage";

function completedState() {
  const seed = sliceSeed();
  return buildRun(seed, scriptSliceActions(seed)).state;
}

describe("slice seed", () => {
  it("builds a seed the engine accepts", () => {
    const seed = createSliceSeed(
      { playerName: "  Dana Levi  ", nationality: " Israel " },
      "slice-run-0001",
    );

    expect(seed.playerName).toBe("Dana Levi");
    expect(seed.nationality).toBe("Israel");
    expect(seed.roleFamily).toBe("attack");
    expect(seed.startAge).toBe(16);
    expect(() => createCareer(seed)).not.toThrow();
  });

  it("generates seed text inside the canonical alphabet", () => {
    // The engine rejects anything else, so a bad generator would break every
    // new run rather than one edge case.
    let counter = 0;
    const bytes = (length: number) =>
      Uint8Array.from({ length }, () => (counter += 37) % 256);

    const text = generateSeedText(bytes);

    expect(text).toMatch(/^[A-Za-z0-9_-]{4,64}$/);
    expect(() => createCareer(createSliceSeed({ playerName: "A", nationality: "B" }, text))).not.toThrow();
  });
});

describe("slice persistence", () => {
  it("reports nothing when there is no save", () => {
    expect(loadRun(fakeStorage())).toEqual({ status: "none" });
  });

  it("restores a finished run exactly", () => {
    const storage = fakeStorage();
    const state = completedState();
    saveRun(storage, state);

    const result = loadRun(storage);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.run.state).toEqual(state);
      expect(result.run.records).toHaveLength(3);
      expect(result.run.complete).toBe(true);
    }
  });

  it("restores a run that stopped in the middle of a season", () => {
    // Reloading the page mid moment must land the player back in the same
    // place, not at the start of the season.
    const storage = fakeStorage();
    const seed = sliceSeed();
    let state = createCareer(seed);
    state = applyAction(state, {
      type: "chooseDecision",
      decisionId: state.season.decisions[0]?.id ?? "",
    }).state;
    saveRun(storage, state);

    const result = loadRun(storage);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.run.state.season.phase).toBe("moment");
      expect(result.run.state).toEqual(state);
    }
  });

  it("separates a save from a newer build from a broken one", () => {
    const save = toCareerSave(completedState());

    const newer = fakeStorage({ [SAVE_KEY]: JSON.stringify({ ...save, version: 2 }) });
    expect(loadRun(newer)).toEqual({ status: "unsupported" });

    const broken = fakeStorage({ [SAVE_KEY]: "{not json" });
    expect(loadRun(broken)).toEqual({ status: "broken" });

    const illegal = fakeStorage({
      [SAVE_KEY]: JSON.stringify({
        ...save,
        actionLog: [{ type: "chooseDecision", decisionId: "s0-not-real" }],
      }),
    });
    expect(loadRun(illegal)).toEqual({ status: "broken" });
  });

  it("clears a save on request", () => {
    const storage = fakeStorage();
    saveRun(storage, completedState());
    expect(storage.size()).toBe(1);

    clearRun(storage);

    expect(storage.size()).toBe(0);
    expect(loadRun(storage)).toEqual({ status: "none" });
  });
});
