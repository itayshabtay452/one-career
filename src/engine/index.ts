/**
 * Public surface of the ONE CAREER engine.
 *
 * The engine is a pure TypeScript module. It has no dependency on React,
 * Phaser, Supabase or any football data provider, and it must stay that way:
 * the same code runs in the browser during a career and on a server when a
 * submitted career is verified.
 */

export {
  MAX_CAREER_AGE,
  MAX_RETIREMENT_AGE,
  MIN_RETIREMENT_AGE,
  RETIREMENT_CHOICE_AGE,
  applyAction,
  computeLegacyInput,
  createCareer,
  replayCareer,
} from "./career";

export {
  EngineError,
  InvalidActionError,
  InvalidSeedError,
  InvalidStateError,
  UnsupportedVersionError,
  type EngineErrorCode,
} from "./errors";

export {
  loadCareerSave,
  parseCareerSave,
  toCareerSave,
  type SaveMigration,
} from "./persistence";

export { START_AGE, isSupportedSeed, parseCareerSeed } from "./seed";

export { createRng, type Rng, type RngChannel } from "./rng";

export {
  clubsByStrength,
  findClub,
  findLeague,
  syntheticWorld,
} from "./world";

export {
  SEED_VERSION,
  STATE_VERSION,
  attributeKeys,
  roleFamilies,
  type AttributeKey,
  type Attributes,
  type CareerAction,
  type CareerDecision,
  type CareerEvent,
  type CareerPhase,
  type CareerPlayer,
  type CareerSave,
  type CareerSeed,
  type CareerState,
  type CareerStatus,
  type Club,
  type Condition,
  type DecisionKind,
  type EngineResult,
  type League,
  type LegacyInput,
  type MomentChoice,
  type MomentFactor,
  type MomentInput,
  type MomentKind,
  type MomentOutcome,
  type MomentPrompt,
  type MomentResult,
  type RoleFamily,
  type SeasonState,
  type SeasonSummary,
  type WorldSnapshot,
} from "./types";
