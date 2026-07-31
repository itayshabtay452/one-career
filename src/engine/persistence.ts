/**
 * Save format, version gate and migration path.
 *
 * A save carries the seed and the action log and nothing else. Loading replays
 * the log through the engine, which means:
 *
 * - a save cannot describe a career the rules would not have produced;
 * - a hand edited save fails on replay instead of becoming a valid career;
 * - a rules change surfaces as a loud replay failure rather than a save that
 *   quietly means something different than it did before.
 */

import { replayCareer } from "./career";
import { InvalidStateError, UnsupportedVersionError } from "./errors";
import { parseCareerSeed } from "./seed";
import {
  STATE_VERSION,
  type CareerAction,
  type CareerSave,
  type CareerState,
  type EngineResult,
  type MomentInput,
} from "./types";

/**
 * One step of the upgrade chain: takes a save at version `from` and returns the
 * same save at version `from + 1`.
 *
 * The registry is empty while version 1 is the only released format. It exists
 * now so that the first real migration is a data change instead of an
 * architecture change, and so the failure message for an unmigratable save is
 * already specified and tested.
 */
export type SaveMigration = (save: Record<string, unknown>) => Record<string, unknown>;

const migrations: ReadonlyMap<number, SaveMigration> = new Map<number, SaveMigration>();

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidStateError("A save must be an object.");
  }

  return value as Record<string, unknown>;
}

function parseAction(value: unknown, index: number): CareerAction {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidStateError(`Action ${index} must be an object.`);
  }

  const record = value as Record<string, unknown>;
  switch (record.type) {
    case "chooseDecision": {
      if (typeof record.decisionId !== "string" || record.decisionId.length === 0) {
        throw new InvalidStateError(
          `Action ${index} of type "chooseDecision" needs a non empty "decisionId".`,
        );
      }

      return Object.freeze({
        type: "chooseDecision" as const,
        decisionId: record.decisionId,
      });
    }

    case "playMoment": {
      // Field level validation happens in the engine when the action is
      // applied, so the rules stay in one place.
      return Object.freeze({
        type: "playMoment" as const,
        input: record.input as MomentInput,
      });
    }

    case "advanceSeason":
      return Object.freeze({ type: "advanceSeason" as const });

    default:
      throw new InvalidStateError(
        `Action ${index} has unknown type ${JSON.stringify(record.type)}.`,
      );
  }
}

/**
 * Brings a save up to the current version, or explains why it cannot be.
 *
 * A save from a newer build is never downgraded: this build does not know what
 * the newer rules did, so guessing would produce a career that never happened.
 */
function upgrade(record: Record<string, unknown>): Record<string, unknown> {
  const version = record.version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    throw new InvalidStateError(
      `"version" must be a positive integer, got ${JSON.stringify(version)}.`,
    );
  }

  if (version > STATE_VERSION) {
    throw new UnsupportedVersionError(
      "UNSUPPORTED_STATE_VERSION",
      "save",
      version,
      STATE_VERSION,
    );
  }

  let current = record;
  let currentVersion = version;
  while (currentVersion < STATE_VERSION) {
    const migration = migrations.get(currentVersion);
    if (!migration) {
      throw new UnsupportedVersionError(
        "UNSUPPORTED_STATE_VERSION",
        "save",
        currentVersion,
        STATE_VERSION,
      );
    }

    current = migration(current);
    currentVersion += 1;
  }

  return current;
}

/** Validates and upgrades an unknown value into a `CareerSave`. */
export function parseCareerSave(value: unknown): CareerSave {
  const upgraded = upgrade(asRecord(value));
  const actionLog = upgraded.actionLog;

  if (!Array.isArray(actionLog)) {
    throw new InvalidStateError('"actionLog" must be an array.');
  }

  return Object.freeze({
    version: STATE_VERSION,
    seed: parseCareerSeed(upgraded.seed),
    actionLog: Object.freeze(
      actionLog.map((action, index) => parseAction(action, index)),
    ),
  });
}

/** Extracts the persistable save from a live state. */
export function toCareerSave(state: CareerState): CareerSave {
  return Object.freeze({
    version: STATE_VERSION,
    seed: state.seed,
    actionLog: state.actionLog,
  });
}

/**
 * Loads a save by replaying it.
 *
 * Throws `UnsupportedVersionError` for a save this build cannot run,
 * `InvalidStateError` for a malformed save, and `InvalidActionError` when the
 * logged actions do not form a legal career.
 */
export function loadCareerSave(value: unknown): EngineResult {
  const save = parseCareerSave(value);
  return replayCareer(save.seed, save.actionLog);
}
