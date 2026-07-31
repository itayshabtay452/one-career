/**
 * Seed parsing and validation.
 *
 * The seed is the whole contract for reproducing a career. Anything that feeds
 * a random draw must live here and must be canonical, so two devices that hold
 * "the same seed" really do hold the same bytes.
 */

import { InvalidSeedError, UnsupportedVersionError } from "./errors";
import {
  SEED_VERSION,
  roleFamilies,
  type CareerSeed,
  type RoleFamily,
} from "./types";

/**
 * Canonical seed alphabet.
 *
 * Seed text drives the hash, so it is restricted to characters that have one
 * unambiguous UTF-16 representation. This rules out normalisation differences
 * between platforms, which would otherwise let the same visible seed produce
 * two different careers.
 */
const SEED_TEXT_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

/** Ages the career rules are defined for. */
export const MIN_START_AGE = 15;
export const MAX_START_AGE = 18;

/** Free text fields never feed a random draw, but they are still bounded. */
const MAX_NAME_LENGTH = 40;

function asRecord(value: unknown, subject: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidSeedError(`${subject} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function requireText(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new InvalidSeedError(`"${field}" must be a string.`);
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new InvalidSeedError(`"${field}" must not be empty.`);
  }

  if (trimmed.length > maxLength) {
    throw new InvalidSeedError(
      `"${field}" must be at most ${maxLength} characters, got ${trimmed.length}.`,
    );
  }

  return trimmed;
}

function requireRoleFamily(value: unknown): RoleFamily {
  if (typeof value !== "string" || !isRoleFamily(value)) {
    throw new InvalidSeedError(
      `"roleFamily" must be one of ${roleFamilies.join(", ")}. Goalkeepers are not playable in V1.`,
    );
  }

  return value;
}

function isRoleFamily(value: string): value is RoleFamily {
  return roleFamilies.some((role) => role === value);
}

function requireInteger(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new InvalidSeedError(`"${field}" must be an integer.`);
  }

  if (value < min || value > max) {
    throw new InvalidSeedError(
      `"${field}" must be between ${min} and ${max}, got ${value}.`,
    );
  }

  return value;
}

/**
 * Validates and normalises an unknown value into a `CareerSeed`.
 *
 * Throws `UnsupportedVersionError` for a seed produced by a different build,
 * and `InvalidSeedError` for anything else that does not satisfy the contract.
 */
export function parseCareerSeed(value: unknown): CareerSeed {
  const record = asRecord(value, "Seed");
  const version = record.version;

  if (version !== SEED_VERSION) {
    throw new UnsupportedVersionError(
      "UNSUPPORTED_SEED_VERSION",
      "seed",
      version,
      SEED_VERSION,
    );
  }

  const seedText = record.seedText;
  if (typeof seedText !== "string" || !SEED_TEXT_PATTERN.test(seedText)) {
    throw new InvalidSeedError(
      `"seedText" must match ${SEED_TEXT_PATTERN.source}. ` +
        `Only unaccented letters, digits, "-" and "_" are allowed so that the same seed reproduces the same career on every device.`,
    );
  }

  return Object.freeze({
    version: SEED_VERSION,
    seedText,
    playerName: requireText(record.playerName, "playerName", MAX_NAME_LENGTH),
    nationality: requireText(record.nationality, "nationality", MAX_NAME_LENGTH),
    roleFamily: requireRoleFamily(record.roleFamily),
    startAge: requireInteger(
      record.startAge,
      "startAge",
      MIN_START_AGE,
      MAX_START_AGE,
    ),
    startYear: requireInteger(record.startYear, "startYear", 1900, 2200),
  });
}

/** True when `value` is a seed this build can run. Never throws. */
export function isSupportedSeed(value: unknown): boolean {
  try {
    parseCareerSeed(value);
    return true;
  } catch {
    return false;
  }
}
