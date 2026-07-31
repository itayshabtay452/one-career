import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { computeLegacyInput } from "./career";
import { playScriptedCareer, sampleSeed, scriptStyle } from "./fixtures";

const ENGINE_DIR = join(process.cwd(), "src", "engine");

/**
 * Removes comments before scanning.
 *
 * The guards below look for banned APIs in real code. Prose that merely names
 * one — including the doc comments that explain why it is banned — must not
 * trip them, or the only way to keep the suite green would be to stop
 * documenting the rule.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function engineSources(): Array<{ file: string; source: string }> {
  return readdirSync(ENGINE_DIR)
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
    .map((file) => ({
      file,
      source: stripComments(readFileSync(join(ENGINE_DIR, file), "utf8")),
    }));
}

describe("determinism guardrails", () => {
  it("finds the engine sources it is supposed to guard", () => {
    // Without this, a rename could quietly turn the checks below into no-ops.
    const files = engineSources().map((entry) => entry.file);

    expect(files).toContain("career.ts");
    expect(files).toContain("rng.ts");
    expect(files.length).toBeGreaterThanOrEqual(7);
  });

  it("never reaches for a non deterministic platform API", () => {
    // These are the ways a replay silently stops reproducing. Catching them in
    // the source is cheaper than debugging a leaderboard dispute later.
    const forbidden: ReadonlyArray<{ pattern: RegExp; why: string }> = [
      { pattern: /Math\s*\.\s*random/, why: "Math.random is not reproducible" },
      { pattern: /Date\s*\.\s*now/, why: "the clock is not part of the seed" },
      { pattern: /new\s+Date\b/, why: "the clock is not part of the seed" },
      {
        pattern: /performance\s*\.\s*now/,
        why: "frame timing must not reach the engine",
      },
      {
        pattern: /crypto\s*\.\s*getRandomValues/,
        why: "system entropy is not reproducible",
      },
      { pattern: /process\s*\.\s*hrtime/, why: "the clock is not part of the seed" },
      {
        pattern: /toLocaleString|localeCompare|\bIntl\b/,
        why: "locale rules vary by platform",
      },
    ];

    for (const { file, source } of engineSources()) {
      for (const { pattern, why } of forbidden) {
        expect(pattern.test(source), `${file} matches ${pattern} — ${why}.`).toBe(
          false,
        );
      }
    }
  });

  it("stays free of UI, game framework and cloud dependencies", () => {
    const banned = ["react", "next/", "next-auth", "phaser", "@supabase", "node:"];

    for (const { file, source } of engineSources()) {
      const specifiers = [...source.matchAll(/from\s+"([^"]+)"/g)].map(
        (match) => match[1] ?? "",
      );

      for (const specifier of specifiers) {
        const offender = banned.find((entry) =>
          specifier.toLowerCase().startsWith(entry),
        );

        expect(
          offender,
          `${file} imports "${specifier}", which the engine must not depend on.`,
        ).toBeUndefined();
      }
    }
  });
});

/**
 * Frozen end to end runs.
 *
 * If any number below moves, the rules changed for every seed that already
 * exists. That is allowed, but it is a breaking change: it needs a state
 * version bump and a migration, not a quiet edit to this file.
 */
describe("regression: reference careers", () => {
  const referenceSeed = sampleSeed({
    seedText: "one-career-golden",
    roleFamily: "midfield",
  });

  it("reproduces the scripted reference career exactly", () => {
    const run = playScriptedCareer(referenceSeed, scriptStyle({ variant: 2 }));

    expect(run.state.status).toBe("retired");
    expect(run.state.retirementAge).toBe(34);
    expect(run.state.player.age).toBe(35);
    expect(run.state.history).toHaveLength(19);

    expect(run.state.player.attributes).toEqual({
      pace: 52,
      technique: 80,
      passing: 74,
      finishing: 44,
      defending: 51,
      physical: 53,
      vision: 67,
      mentality: 55,
    });

    expect(computeLegacyInput(run.state)).toEqual({
      seasonsPlayed: 19,
      decisiveMoments: 0,
      poorMoments: 13,
      peakRating: 78,
      averageRating: 52,
      finalReputation: 60,
      totalGrowth: 32,
      clubsPlayedFor: 6,
    });

    expect(run.state.history[0]).toEqual({
      index: 0,
      year: 2026,
      age: 16,
      clubId: "cl-pinefield",
      decisionId: "s0-transfer-cl-pinefield",
      momentOutcome: "poor",
      momentScore: 21,
      rating: 42,
      growth: 3,
    });
  });

  it("reproduces the perfectly executed reference career exactly", () => {
    const run = playScriptedCareer(
      referenceSeed,
      scriptStyle({ perfectExecution: true }),
    );

    expect(run.state.history).toHaveLength(19);
    expect(computeLegacyInput(run.state)).toEqual({
      seasonsPlayed: 19,
      decisiveMoments: 6,
      poorMoments: 0,
      peakRating: 91,
      averageRating: 79,
      finalReputation: 100,
      totalGrowth: 53,
      clubsPlayedFor: 6,
    });
  });

  it("separates skill from luck on one seed", () => {
    // Same seed, same world, same moments: only execution differs. This is the
    // property a Daily leaderboard depends on.
    const sloppy = computeLegacyInput(
      playScriptedCareer(referenceSeed, scriptStyle({ variant: 2 })).state,
    );
    const perfect = computeLegacyInput(
      playScriptedCareer(referenceSeed, scriptStyle({ perfectExecution: true })).state,
    );

    expect(perfect.seasonsPlayed).toBe(sloppy.seasonsPlayed);
    expect(perfect.averageRating).toBeGreaterThan(sloppy.averageRating);
    expect(perfect.decisiveMoments).toBeGreaterThan(sloppy.decisiveMoments);
    expect(perfect.poorMoments).toBeLessThan(sloppy.poorMoments);
  });
});
