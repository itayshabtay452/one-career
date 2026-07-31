/**
 * Core contracts for the ONE CAREER deterministic career engine.
 *
 * Every shape in this file is plain data: no class instances, no functions and
 * no references to the DOM, React, Phaser or any cloud service. A career state
 * must survive `JSON.stringify` / `JSON.parse` without losing information, so
 * that a save can be replayed and verified on a server later.
 */

/** Version of the seed contract. Bumped when the seed shape changes. */
export const SEED_VERSION = 1;

/** Version of the persisted career state contract. */
export const STATE_VERSION = 1;

export type SeedVersion = typeof SEED_VERSION;
export type StateVersion = typeof STATE_VERSION;

/** Role families playable in V1. Goalkeepers are intentionally excluded. */
export const roleFamilies = ["attack", "midfield", "defence"] as const;
export type RoleFamily = (typeof roleFamilies)[number];

/** The eight base attributes from the product spec. */
export const attributeKeys = [
  "pace",
  "technique",
  "passing",
  "finishing",
  "defending",
  "physical",
  "vision",
  "mentality",
] as const;
export type AttributeKey = (typeof attributeKeys)[number];

/** Attribute values are integers in the range 1..99. */
export type Attributes = Readonly<Record<AttributeKey, number>>;

/** Dynamic values are integers in the range 0..100. */
export type Condition = Readonly<{
  fitness: number;
  morale: number;
  sharpness: number;
  reputation: number;
}>;

/**
 * Everything needed to regenerate a career from scratch.
 *
 * `seedText` is the only source of randomness. Two careers created from equal
 * seeds produce byte-identical states for an identical action log.
 */
export type CareerSeed = Readonly<{
  version: SeedVersion;
  /** Canonical seed string. Shared by every player of a Daily career. */
  seedText: string;
  /** Identity chosen by the player. Never affects random draws. */
  playerName: string;
  nationality: string;
  roleFamily: RoleFamily;
  /** Age at the first season. */
  startAge: number;
  /** Calendar year of the first season, used for the career timeline. */
  startYear: number;
}>;

export type CareerPlayer = Readonly<{
  name: string;
  nationality: string;
  roleFamily: RoleFamily;
  age: number;
  attributes: Attributes;
  condition: Condition;
  /** Inclusive potential band. Narrows as the career progresses. */
  potential: Readonly<{ low: number; high: number }>;
}>;

/** A synthetic club. No real world club data is used by the engine. */
export type Club = Readonly<{
  id: string;
  name: string;
  leagueId: string;
  /** Club quality, 1..99. Drives decision difficulty and moment pressure. */
  strength: number;
}>;

export type League = Readonly<{
  id: string;
  name: string;
  /** League tier, 1 is the strongest. */
  tier: number;
}>;

/** The synthetic world a career is played in. */
export type WorldSnapshot = Readonly<{
  id: string;
  leagues: readonly League[];
  clubs: readonly Club[];
}>;

/** What the engine is waiting for. Drives the UI without the UI driving state. */
export type CareerPhase = "decision" | "moment" | "summary" | "ended";

export type DecisionKind =
  | "transfer"
  | "stay"
  | "trainingFocus"
  | "roleChange"
  | "retire";

/** One selectable option inside a season decision. */
export type CareerDecision = Readonly<{
  id: string;
  kind: DecisionKind;
  /** Stable, untranslated label key. Presentation layer owns the wording. */
  labelKey: string;
  /** Club this option moves the player to, when the option is a transfer. */
  clubId: string | null;
  /** Attribute emphasised by this option during end of season development. */
  focus: AttributeKey | null;
  /** Immediate condition deltas applied when the option is chosen. */
  effects: Readonly<{
    morale: number;
    sharpness: number;
    reputation: number;
  }>;
}>;

export type MomentKind = "shot" | "throughBall" | "dribble" | "tackle";
export type MomentChoice = "shoot" | "pass" | "dribble" | "tackle";

/** The decisive moment the engine generated for the current season. */
export type MomentPrompt = Readonly<{
  kind: MomentKind;
  /** Action the situation actually calls for. Never shown before the input. */
  expectedChoice: MomentChoice;
  /** Opposition pressure, 0..100. */
  pressure: number;
  /** Ideal aim on a discrete -2..2 axis. */
  idealDirection: number;
  /** Ideal power, 0..100. */
  idealPower: number;
  /** Half width of the forgiving timing window, in timing units. */
  timingWindow: number;
}>;

/**
 * Player input for a moment.
 *
 * All fields are discrete integers on purpose. Frame timing, pointer velocity
 * and physics are converted to these values by the presentation layer, so the
 * engine never depends on frame rate.
 */
export type MomentInput = Readonly<{
  choice: MomentChoice;
  /** -2..2 */
  direction: number;
  /** 0..100 */
  power: number;
  /** -100..100, where 0 is perfectly on time. */
  timing: number;
}>;

export type MomentOutcome = "decisive" | "positive" | "neutral" | "poor";

/** Why a moment ended the way it did. Feeds the post action feedback. */
export type MomentFactor =
  | "choice"
  | "direction"
  | "power"
  | "timing"
  | "pressure"
  | "attribute";

export type MomentResult = Readonly<{
  outcome: MomentOutcome;
  /** Execution score, 0..100. */
  score: number;
  /** The single factor that moved the score the most. */
  decidingFactor: MomentFactor;
  /** Luck component drawn from the seed, -10..10. Independent of the input. */
  variance: number;
}>;

export type SeasonState = Readonly<{
  /** Zero based index into the career. */
  index: number;
  year: number;
  age: number;
  clubId: string;
  phase: CareerPhase;
  /** Options offered this season. Regenerated deterministically per season. */
  decisions: readonly CareerDecision[];
  /** Option the player picked, or null while the decision is pending. */
  chosenDecisionId: string | null;
  moment: MomentPrompt;
  momentResult: MomentResult | null;
}>;

export type SeasonSummary = Readonly<{
  index: number;
  year: number;
  age: number;
  clubId: string;
  decisionId: string;
  momentOutcome: MomentOutcome;
  momentScore: number;
  /** Season rating, 0..100. */
  rating: number;
  /** Attribute points gained this season, after the age curve. */
  growth: number;
}>;

/**
 * Raw counters used later to compute the Legacy Score.
 *
 * The weighting formula is deliberately not implemented here: it belongs to the
 * Legacy issue together with balancing. The engine only reports facts.
 */
export type LegacyInput = Readonly<{
  seasonsPlayed: number;
  decisiveMoments: number;
  poorMoments: number;
  peakRating: number;
  averageRating: number;
  finalReputation: number;
  totalGrowth: number;
  clubsPlayedFor: number;
}>;

export type CareerStatus = "active" | "retired";

export type CareerState = Readonly<{
  version: StateVersion;
  seed: CareerSeed;
  worldId: string;
  status: CareerStatus;
  /**
   * Age at which this career ends whatever the player chooses. Drawn from the
   * seed, so "retirement varies" is a property of the career rather than of the
   * moment the player happens to stop.
   */
  retirementAge: number;
  player: CareerPlayer;
  season: SeasonState;
  history: readonly SeasonSummary[];
  /** Every action applied so far, in order. Replaying it rebuilds the state. */
  actionLog: readonly CareerAction[];
}>;

export type CareerAction =
  | Readonly<{ type: "chooseDecision"; decisionId: string }>
  | Readonly<{ type: "playMoment"; input: MomentInput }>
  | Readonly<{ type: "advanceSeason" }>;

export type CareerEvent =
  | Readonly<{ type: "decisionApplied"; decisionId: string; clubId: string }>
  | Readonly<{ type: "momentResolved"; result: MomentResult }>
  | Readonly<{ type: "seasonCompleted"; summary: SeasonSummary }>
  | Readonly<{ type: "careerEnded"; reason: "retired" | "ageLimit" }>;

/** Result of applying a single action. Both fields are new values. */
export type EngineResult = Readonly<{
  state: CareerState;
  events: readonly CareerEvent[];
}>;

/**
 * The persisted form of a career.
 *
 * A save stores the seed and the action log, never the derived state. Loading
 * replays the log, so a tampered or partially written save cannot produce a
 * career the rules would not have produced, and a rules change is visible as a
 * replay failure instead of a silently wrong save.
 */
export type CareerSave = Readonly<{
  version: StateVersion;
  seed: CareerSeed;
  actionLog: readonly CareerAction[];
}>;
