/**
 * Local persistence for a slice run.
 *
 * The whole save is a seed plus an action log, exactly as ADR-003 defines it,
 * so restoring a run is a replay rather than a state restore. Nothing here
 * touches a network or a cloud service: the slice is explicitly local only.
 */

import {
  UnsupportedVersionError,
  loadCareerSave,
  parseCareerSave,
  toCareerSave,
  type CareerSeed,
  type CareerState,
  type RoleFamily,
} from "@/engine";

import { SLICE_START_YEAR, buildRun, type SliceRun } from "./journal";

export const SAVE_KEY = "one-career.slice.v1";

/** The subset of the Storage API the slice needs, so tests can pass a fake. */
export type SliceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type LoadResult =
  | { status: "none" }
  | { status: "ok"; run: SliceRun }
  /** Written by a build with a newer save format. */
  | { status: "unsupported" }
  /** Unreadable, malformed, or no longer a legal career under current rules. */
  | { status: "broken" };

/** Seed alphabet allowed by the engine, minus characters that are easy to misread. */
const SEED_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const SEED_LENGTH = 16;

/**
 * Draws a fresh seed for a new run.
 *
 * This is the one place a slice may be non deterministic: choosing which career
 * to play. Everything downstream of the seed is fully reproducible.
 */
export function generateSeedText(
  randomBytes: (length: number) => Uint8Array = browserRandomBytes,
): string {
  const bytes = randomBytes(SEED_LENGTH);
  let text = "";

  for (const byte of bytes) {
    text += SEED_ALPHABET[byte % SEED_ALPHABET.length];
  }

  return text;
}

function browserRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export type PlayerIdentity = {
  playerName: string;
  nationality: string;
  roleFamily?: RoleFamily;
};

/** Builds the seed for a new slice run. */
export function createSliceSeed(
  identity: PlayerIdentity,
  seedText: string,
): CareerSeed {
  return {
    version: 1,
    seedText,
    playerName: identity.playerName.trim(),
    nationality: identity.nationality.trim(),
    roleFamily: identity.roleFamily ?? "attack",
    startAge: 16,
    startYear: SLICE_START_YEAR,
  };
}

export function saveRun(storage: SliceStorage, state: CareerState): void {
  storage.setItem(SAVE_KEY, JSON.stringify(toCareerSave(state)));
}

export function clearRun(storage: SliceStorage): void {
  storage.removeItem(SAVE_KEY);
}

/**
 * Reads a saved run and rebuilds it by replaying.
 *
 * A save from a newer build is reported separately from a broken one, because
 * the two need different words: one asks the player to update, the other says
 * the save is gone.
 */
export function loadRun(storage: SliceStorage): LoadResult {
  return parseSavedPayload(storage.getItem(SAVE_KEY));
}

/** Same as `loadRun`, for callers that already hold the raw payload. */
export function parseSavedPayload(raw: string | null): LoadResult {
  if (!raw) {
    return { status: "none" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "broken" };
  }

  try {
    const save = parseCareerSave(parsed);
    loadCareerSave(parsed);
    return { status: "ok", run: buildRun(save.seed, save.actionLog) };
  } catch (error) {
    return error instanceof UnsupportedVersionError
      ? { status: "unsupported" }
      : { status: "broken" };
  }
}
