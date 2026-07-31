/**
 * The deterministic career engine.
 *
 * Every exported function is pure: it reads its arguments, returns new values
 * and never mutates its input, reads the clock, touches the network or calls
 * `Math.random`. Applying the same action log to the same seed always rebuilds
 * exactly the same state, which is what lets a server re-run a submitted career
 * and verify it.
 *
 * Balance values in this file are deliberate placeholders. Issue #4 defines the
 * contract and the determinism guarantees; tuning belongs to the balancing work.
 */

import { InvalidActionError } from "./errors";
import { createRng, type Rng } from "./rng";
import { parseCareerSeed } from "./seed";
import {
  STATE_VERSION,
  attributeKeys,
  type AttributeKey,
  type Attributes,
  type CareerAction,
  type CareerDecision,
  type CareerEvent,
  type CareerPlayer,
  type CareerSeed,
  type CareerState,
  type Condition,
  type EngineResult,
  type LegacyInput,
  type MomentChoice,
  type MomentFactor,
  type MomentInput,
  type MomentKind,
  type MomentPrompt,
  type MomentResult,
  type RoleFamily,
  type SeasonState,
  type SeasonSummary,
} from "./types";
import { clubsByStrength, findClub, syntheticWorld } from "./world";

/** Age at which the retire option starts being offered. */
export const RETIREMENT_CHOICE_AGE = 33;

/**
 * Inclusive band the forced retirement age is drawn from.
 *
 * The product spec describes retirement as varying between 34 and 39 and a full
 * run as 18 to 22 seasons. Starting at 16, those two statements only overlap
 * between 34 and 37, so the engine draws from the overlap and a full career
 * lands at 19 to 22 seasons. This is recorded as an assumption in ADR-003.
 */
export const MIN_RETIREMENT_AGE = 34;
export const MAX_RETIREMENT_AGE = 37;

/** Hard ceiling. No career may run past this age under any rule. */
export const MAX_CAREER_AGE = 39;

const MOMENT_CHOICES: readonly MomentChoice[] = [
  "shoot",
  "pass",
  "dribble",
  "tackle",
];

const ROLE_TEMPLATES: Readonly<Record<RoleFamily, Attributes>> = {
  attack: {
    pace: 62,
    technique: 60,
    passing: 50,
    finishing: 64,
    defending: 30,
    physical: 52,
    vision: 48,
    mentality: 50,
  },
  midfield: {
    pace: 52,
    technique: 62,
    passing: 66,
    finishing: 46,
    defending: 50,
    physical: 52,
    vision: 64,
    mentality: 52,
  },
  defence: {
    pace: 52,
    technique: 48,
    passing: 50,
    finishing: 30,
    defending: 66,
    physical: 64,
    vision: 48,
    mentality: 56,
  },
};

/** Attributes that define each role, used for growth and moment relevance. */
const ROLE_KEY_ATTRIBUTES: Readonly<Record<RoleFamily, readonly AttributeKey[]>> =
  {
    attack: ["finishing", "pace", "technique", "mentality"],
    midfield: ["passing", "vision", "technique", "mentality"],
    defence: ["defending", "physical", "pace", "mentality"],
  };

const MOMENT_ATTRIBUTE: Readonly<Record<MomentKind, AttributeKey>> = {
  shot: "finishing",
  throughBall: "passing",
  dribble: "technique",
  tackle: "defending",
};

const MOMENT_EXPECTED_CHOICE: Readonly<Record<MomentKind, MomentChoice>> = {
  shot: "shoot",
  throughBall: "pass",
  dribble: "dribble",
  tackle: "tackle",
};

const ROLE_MOMENT_KINDS: Readonly<Record<RoleFamily, readonly MomentKind[]>> = {
  attack: ["shot", "shot", "dribble", "throughBall"],
  midfield: ["throughBall", "throughBall", "dribble", "tackle"],
  defence: ["tackle", "tackle", "dribble", "throughBall"],
};

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }

  return value > max ? max : value;
}

/** Integer division that rounds toward zero, so negatives behave predictably. */
function divide(value: number, divisor: number): number {
  return Math.trunc(value / divisor);
}

function overallOf(attributes: Attributes, role: RoleFamily): number {
  const keys = ROLE_KEY_ATTRIBUTES[role];
  let total = 0;
  for (const key of keys) {
    total += attributes[key];
  }

  return divide(total, keys.length);
}

function mapAttributes(
  attributes: Attributes,
  update: (key: AttributeKey, value: number) => number,
): Attributes {
  const next: Record<AttributeKey, number> = { ...attributes };
  for (const key of attributeKeys) {
    next[key] = clamp(update(key, attributes[key]), 1, 99);
  }

  return Object.freeze(next);
}

// ---------------------------------------------------------------------------
// Career creation
// ---------------------------------------------------------------------------

function runAcademyTrial(seed: CareerSeed): CareerPlayer {
  const rng = createRng(seed.seedText, "academy", 0);
  const template = ROLE_TEMPLATES[seed.roleFamily];

  const attributes = mapAttributes(
    template,
    (_key, value) => value + rng.intBetween(-6, 6),
  );

  const overall = overallOf(attributes, seed.roleFamily);
  const potentialLow = clamp(overall + rng.intBetween(2, 8), 1, 99);
  const potentialHigh = clamp(potentialLow + rng.intBetween(6, 20), 1, 99);

  return Object.freeze({
    name: seed.playerName,
    nationality: seed.nationality,
    roleFamily: seed.roleFamily,
    age: seed.startAge,
    attributes,
    condition: Object.freeze({
      fitness: clamp(80 + rng.intBetween(-5, 10), 0, 100),
      morale: clamp(65 + rng.intBetween(-5, 10), 0, 100),
      sharpness: clamp(45 + rng.intBetween(-10, 10), 0, 100),
      reputation: clamp(10 + rng.intBetween(0, 8), 0, 100),
    }),
    potential: Object.freeze({ low: potentialLow, high: potentialHigh }),
  });
}

/**
 * Draws the age this career is forced to end at.
 *
 * It uses its own stream address rather than continuing the academy sequence,
 * so adding this draw did not shift a single value the trial already produced.
 */
function drawRetirementAge(seed: CareerSeed): number {
  const rng = createRng(seed.seedText, "academy", 1);
  return clamp(
    rng.intBetween(MIN_RETIREMENT_AGE, MAX_RETIREMENT_AGE),
    seed.startAge + 1,
    MAX_CAREER_AGE,
  );
}

function pickStartingClub(seed: CareerSeed, player: CareerPlayer): string {
  const rng = createRng(seed.seedText, "world", 0);
  const ranked = clubsByStrength(syntheticWorld);
  const overall = overallOf(player.attributes, player.roleFamily);

  // A stronger trial opens a slightly better first club, never a top club.
  const reach = clamp(divide(overall - 40, 6) + rng.intBetween(0, 1), 0, 5);
  const club = ranked[reach];
  if (!club) {
    throw new Error("Synthetic world must contain at least six clubs.");
  }

  return club.id;
}

/**
 * Builds the decision options offered in one season.
 *
 * Options are addressed by a stable id that includes the season index, so an
 * action log recorded in one build cannot silently select a different option
 * after the option list changes.
 */
function buildDecisions(
  seed: CareerSeed,
  seasonIndex: number,
  age: number,
  clubId: string,
  player: CareerPlayer,
): readonly CareerDecision[] {
  const rng = createRng(seed.seedText, "decisions", seasonIndex);
  const prefix = `s${seasonIndex}`;
  const roleKeys = ROLE_KEY_ATTRIBUTES[player.roleFamily];
  const options: CareerDecision[] = [];

  options.push(
    Object.freeze({
      id: `${prefix}-stay`,
      kind: "stay" as const,
      labelKey: "decision.stay",
      clubId: null,
      focus: rng.pick(roleKeys),
      effects: Object.freeze({ morale: 3, sharpness: 5, reputation: 1 }),
    }),
  );

  options.push(
    Object.freeze({
      id: `${prefix}-training`,
      kind: "trainingFocus" as const,
      labelKey: "decision.trainingFocus",
      clubId: null,
      focus: rng.pick(attributeKeys),
      effects: Object.freeze({ morale: -2, sharpness: 8, reputation: 0 }),
    }),
  );

  const offer = findTransferOffer(rng, clubId, player);
  if (offer) {
    options.push(
      Object.freeze({
        id: `${prefix}-transfer-${offer}`,
        kind: "transfer" as const,
        labelKey: "decision.transfer",
        clubId: offer,
        focus: rng.pick(roleKeys),
        effects: Object.freeze({ morale: 6, sharpness: -4, reputation: 4 }),
      }),
    );
  }

  if (age >= RETIREMENT_CHOICE_AGE) {
    options.push(
      Object.freeze({
        id: `${prefix}-retire`,
        kind: "retire" as const,
        labelKey: "decision.retire",
        clubId: null,
        focus: null,
        effects: Object.freeze({ morale: 0, sharpness: 0, reputation: 0 }),
      }),
    );
  }

  return Object.freeze(options);
}

/**
 * Finds a club willing to sign the player.
 *
 * Interest is driven by reputation and role overall, so a strong career opens
 * stronger clubs and a poor one opens weaker ones.
 */
function findTransferOffer(
  rng: Rng,
  currentClubId: string,
  player: CareerPlayer,
): string | null {
  const overall = overallOf(player.attributes, player.roleFamily);
  const pull = divide(overall + player.condition.reputation, 2);
  const ceiling = pull + rng.intBetween(-6, 10);

  const candidates = clubsByStrength(syntheticWorld).filter(
    (club) => club.id !== currentClubId && club.strength <= ceiling,
  );

  if (candidates.length === 0) {
    return null;
  }

  // Prefer the strongest club that is still interested, with a little noise so
  // two identical careers on different seeds do not always converge.
  const topIndex = candidates.length - 1;
  const index = clamp(topIndex - rng.intBelow(2), 0, topIndex);
  return candidates[index]?.id ?? null;
}

/**
 * Draws the decisive moment for a season.
 *
 * The luck component is drawn here rather than at resolution time and does not
 * depend on player input, so every player who reaches this moment on a Daily
 * seed faces exactly the same conditions and only execution separates them.
 */
function drawMoment(
  seed: CareerSeed,
  seasonIndex: number,
  clubStrength: number,
  role: RoleFamily,
): { prompt: MomentPrompt; variance: number } {
  const rng = createRng(seed.seedText, "moment", seasonIndex);
  const kind = rng.pick(ROLE_MOMENT_KINDS[role]);
  const pressure = clamp(
    20 + divide(clubStrength, 2) + rng.intBetween(-10, 10),
    0,
    100,
  );

  const prompt: MomentPrompt = Object.freeze({
    kind,
    expectedChoice: MOMENT_EXPECTED_CHOICE[kind],
    pressure,
    idealDirection: rng.intBetween(-2, 2),
    idealPower: rng.intBetween(30, 95),
    timingWindow: clamp(30 - divide(pressure, 5) + rng.intBetween(-3, 3), 6, 30),
  });

  return { prompt, variance: rng.intBetween(-10, 10) };
}

function createSeason(
  seed: CareerSeed,
  player: CareerPlayer,
  seasonIndex: number,
  clubId: string,
): SeasonState {
  const club = findClub(syntheticWorld, clubId);
  if (!club) {
    throw new Error(`Unknown club id "${clubId}" in synthetic world.`);
  }

  const { prompt } = drawMoment(seed, seasonIndex, club.strength, player.roleFamily);

  return Object.freeze({
    index: seasonIndex,
    year: seed.startYear + seasonIndex,
    age: player.age,
    clubId,
    phase: "decision" as const,
    decisions: buildDecisions(seed, seasonIndex, player.age, clubId, player),
    chosenDecisionId: null,
    moment: prompt,
    momentResult: null,
  });
}

/**
 * Creates a fresh career from a seed.
 *
 * Throws `UnsupportedVersionError` or `InvalidSeedError` when the seed cannot
 * be run by this build.
 */
export function createCareer(seedInput: unknown): CareerState {
  const seed = parseCareerSeed(seedInput);
  const player = runAcademyTrial(seed);
  const clubId = pickStartingClub(seed, player);

  return Object.freeze({
    version: STATE_VERSION,
    seed,
    worldId: syntheticWorld.id,
    status: "active" as const,
    retirementAge: drawRetirementAge(seed),
    player,
    season: createSeason(seed, player, 0, clubId),
    history: Object.freeze([]),
    actionLog: Object.freeze([]),
  });
}

// ---------------------------------------------------------------------------
// Moment resolution
// ---------------------------------------------------------------------------

function isMomentChoice(value: unknown): value is MomentChoice {
  return (
    typeof value === "string" &&
    MOMENT_CHOICES.some((choice) => choice === value)
  );
}

function validateMomentInput(input: unknown): MomentInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new InvalidActionError("Moment input must be an object.");
  }

  const record = input as Record<string, unknown>;
  if (!isMomentChoice(record.choice)) {
    throw new InvalidActionError(
      `Moment "choice" must be one of ${MOMENT_CHOICES.join(", ")}.`,
    );
  }

  const readInteger = (field: string, min: number, max: number): number => {
    const value = record[field];
    if (typeof value !== "number" || !Number.isInteger(value)) {
      throw new InvalidActionError(
        `Moment "${field}" must be an integer. Continuous input must be quantised before it reaches the engine.`,
      );
    }

    if (value < min || value > max) {
      throw new InvalidActionError(
        `Moment "${field}" must be between ${min} and ${max}, got ${value}.`,
      );
    }

    return value;
  };

  return Object.freeze({
    choice: record.choice,
    direction: readInteger("direction", -2, 2),
    power: readInteger("power", 0, 100),
    timing: readInteger("timing", -100, 100),
  });
}

/**
 * Scores a moment from discrete input.
 *
 * Every term is an integer, and the deciding factor reported back is simply the
 * term with the largest absolute contribution. Luck is excluded from that
 * comparison: the feedback explains what the player did, not what the dice did.
 */
function resolveMoment(
  prompt: MomentPrompt,
  input: MomentInput,
  variance: number,
  player: CareerPlayer,
): MomentResult {
  const attribute = player.attributes[MOMENT_ATTRIBUTE[prompt.kind]];

  const contributions: ReadonlyArray<{
    factor: MomentFactor;
    value: number;
  }> = [
    {
      factor: "choice",
      value: input.choice === prompt.expectedChoice ? 22 : -18,
    },
    {
      factor: "direction",
      value: -7 * Math.abs(input.direction - prompt.idealDirection),
    },
    {
      factor: "power",
      value: -clamp(divide(Math.abs(input.power - prompt.idealPower), 4), 0, 25),
    },
    {
      factor: "timing",
      value: -clamp(
        divide(Math.max(0, Math.abs(input.timing) - prompt.timingWindow), 3),
        0,
        25,
      ),
    },
    { factor: "attribute", value: divide(attribute - 50, 3) },
    { factor: "pressure", value: -divide(prompt.pressure, 10) },
  ];

  let total = 50 + variance;
  let deciding = contributions[0] as { factor: MomentFactor; value: number };
  for (const contribution of contributions) {
    total += contribution.value;
    if (Math.abs(contribution.value) > Math.abs(deciding.value)) {
      deciding = contribution;
    }
  }

  const score = clamp(total, 0, 100);

  return Object.freeze({
    outcome: outcomeFor(score),
    score,
    decidingFactor: deciding.factor,
    variance,
  });
}

function outcomeFor(score: number): MomentResult["outcome"] {
  if (score >= 78) {
    return "decisive";
  }

  if (score >= 58) {
    return "positive";
  }

  return score >= 38 ? "neutral" : "poor";
}

// ---------------------------------------------------------------------------
// Season development
// ---------------------------------------------------------------------------

/** Attribute points gained per season before performance adjustments. */
function ageGrowth(age: number): number {
  if (age <= 21) {
    return 3;
  }

  if (age <= 25) {
    return 2;
  }

  if (age <= 29) {
    return 1;
  }

  return age <= 32 ? 0 : -1;
}

function performanceGrowth(rating: number): number {
  if (rating >= 75) {
    return 2;
  }

  if (rating >= 60) {
    return 1;
  }

  return rating < 40 ? -1 : 0;
}

function seasonRating(
  momentScore: number,
  player: CareerPlayer,
  clubStrength: number,
): number {
  const overall = overallOf(player.attributes, player.roleFamily);
  // Playing above the level of the squad is worth more than coasting below it.
  const context = clamp(overall - divide(clubStrength, 2), -20, 20);
  return clamp(
    divide(momentScore * 2 + overall + player.condition.sharpness + context, 4),
    0,
    100,
  );
}

/**
 * Applies one season of development and returns the aged up player.
 *
 * Growth is capped by the potential band, which itself narrows every season, so
 * a career converges on a believable ceiling instead of growing forever.
 */
function developPlayer(
  seed: CareerSeed,
  seasonIndex: number,
  player: CareerPlayer,
  focus: AttributeKey | null,
  rating: number,
  effects: CareerDecision["effects"],
): { player: CareerPlayer; growth: number } {
  const rng = createRng(seed.seedText, "development", seasonIndex);
  const points = ageGrowth(player.age) + performanceGrowth(rating);
  const roleKeys = ROLE_KEY_ATTRIBUTES[player.roleFamily];
  const overall = overallOf(player.attributes, player.roleFamily);
  const headroom = player.potential.high - overall;

  // A player at the top of the band still trains, but gains almost nothing.
  const effectivePoints =
    points > 0 && headroom <= 0 ? 0 : points > 0 ? clamp(points, 0, headroom) : points;

  const deltas: Record<AttributeKey, number> = {
    pace: 0,
    technique: 0,
    passing: 0,
    finishing: 0,
    defending: 0,
    physical: 0,
    vision: 0,
    mentality: 0,
  };

  if (effectivePoints > 0) {
    const focused = focus ?? rng.pick(roleKeys);
    deltas[focused] += Math.ceil(effectivePoints / 2);
    let remaining = effectivePoints - Math.ceil(effectivePoints / 2);
    while (remaining > 0) {
      deltas[rng.pick(roleKeys)] += 1;
      remaining -= 1;
    }
  } else if (effectivePoints < 0) {
    // Decline hits the physical side of the game first.
    const declineOrder: readonly AttributeKey[] = ["pace", "physical", "technique"];
    let remaining = -effectivePoints;
    let cursor = 0;
    while (remaining > 0) {
      const key = declineOrder[cursor % declineOrder.length] as AttributeKey;
      deltas[key] -= 1;
      remaining -= 1;
      cursor += 1;
    }
  }

  const attributes = mapAttributes(
    player.attributes,
    (key, value) => value + deltas[key],
  );

  const nextOverall = overallOf(attributes, player.roleFamily);
  const condition: Condition = Object.freeze({
    fitness: clamp(
      player.condition.fitness - (player.age >= 30 ? 2 : 0) + rng.intBetween(-2, 2),
      0,
      100,
    ),
    morale: clamp(
      player.condition.morale + effects.morale + divide(rating - 55, 6),
      0,
      100,
    ),
    sharpness: clamp(
      player.condition.sharpness + effects.sharpness + divide(rating - 50, 8),
      0,
      100,
    ),
    reputation: clamp(
      player.condition.reputation + effects.reputation + divide(rating - 50, 5),
      0,
      100,
    ),
  });

  return {
    player: Object.freeze({
      ...player,
      age: player.age + 1,
      attributes,
      condition,
      // The band narrows toward what the career has actually shown.
      potential: Object.freeze({
        low: clamp(Math.max(player.potential.low, nextOverall), 1, 99),
        high: clamp(Math.max(player.potential.high - 1, nextOverall), 1, 99),
      }),
    }),
    growth: effectivePoints,
  };
}

// ---------------------------------------------------------------------------
// Action handling
// ---------------------------------------------------------------------------

function findDecision(
  season: SeasonState,
  decisionId: string,
): CareerDecision {
  const decision = season.decisions.find((option) => option.id === decisionId);
  if (!decision) {
    const available = season.decisions.map((option) => option.id).join(", ");
    throw new InvalidActionError(
      `Unknown decision "${decisionId}" for season ${season.index}. Available: ${available}.`,
    );
  }

  return decision;
}

function expectPhase(state: CareerState, expected: SeasonState["phase"]): void {
  if (state.season.phase !== expected) {
    throw new InvalidActionError(
      `Expected the career to be in the "${expected}" phase, but it is in "${state.season.phase}".`,
    );
  }
}

function withAction(state: CareerState, action: CareerAction): readonly CareerAction[] {
  return Object.freeze([...state.actionLog, Object.freeze(action)]);
}

function applyChooseDecision(
  state: CareerState,
  action: Extract<CareerAction, { type: "chooseDecision" }>,
): EngineResult {
  expectPhase(state, "decision");
  const decision = findDecision(state.season, action.decisionId);
  const actionLog = withAction(state, action);

  if (decision.kind === "retire") {
    return {
      state: Object.freeze({
        ...state,
        status: "retired" as const,
        season: Object.freeze({
          ...state.season,
          phase: "ended" as const,
          chosenDecisionId: decision.id,
        }),
        actionLog,
      }),
      events: Object.freeze([
        { type: "careerEnded" as const, reason: "retired" as const },
      ]),
    };
  }

  const clubId = decision.clubId ?? state.season.clubId;

  return {
    state: Object.freeze({
      ...state,
      season: Object.freeze({
        ...state.season,
        clubId,
        phase: "moment" as const,
        chosenDecisionId: decision.id,
      }),
      actionLog,
    }),
    events: Object.freeze([
      { type: "decisionApplied" as const, decisionId: decision.id, clubId },
    ]),
  };
}

function applyPlayMoment(
  state: CareerState,
  action: Extract<CareerAction, { type: "playMoment" }>,
): EngineResult {
  expectPhase(state, "moment");
  const input = validateMomentInput(action.input);
  const club = findClub(syntheticWorld, state.season.clubId);
  if (!club) {
    throw new Error(`Unknown club id "${state.season.clubId}" in synthetic world.`);
  }

  const { variance } = drawMoment(
    state.seed,
    state.season.index,
    club.strength,
    state.player.roleFamily,
  );
  const result = resolveMoment(state.season.moment, input, variance, state.player);

  return {
    state: Object.freeze({
      ...state,
      season: Object.freeze({
        ...state.season,
        phase: "summary" as const,
        momentResult: result,
      }),
      // The validated input is logged, so a replay cannot depend on unchecked data.
      actionLog: withAction(state, { type: "playMoment", input }),
    }),
    events: Object.freeze([{ type: "momentResolved" as const, result }]),
  };
}

function applyAdvanceSeason(
  state: CareerState,
  action: Extract<CareerAction, { type: "advanceSeason" }>,
): EngineResult {
  expectPhase(state, "summary");
  const season = state.season;
  const momentResult = season.momentResult;
  const chosenId = season.chosenDecisionId;
  if (!momentResult || !chosenId) {
    throw new InvalidActionError(
      "The season cannot be closed before its decision and moment are resolved.",
    );
  }

  const decision = findDecision(season, chosenId);
  const club = findClub(syntheticWorld, season.clubId);
  if (!club) {
    throw new Error(`Unknown club id "${season.clubId}" in synthetic world.`);
  }

  const rating = seasonRating(momentResult.score, state.player, club.strength);
  const development = developPlayer(
    state.seed,
    season.index,
    state.player,
    decision.focus,
    rating,
    decision.effects,
  );

  const summary: SeasonSummary = Object.freeze({
    index: season.index,
    year: season.year,
    age: season.age,
    clubId: season.clubId,
    decisionId: decision.id,
    momentOutcome: momentResult.outcome,
    momentScore: momentResult.score,
    rating,
    growth: development.growth,
  });

  const history = Object.freeze([...state.history, summary]);
  const actionLog = withAction(state, action);
  const events: CareerEvent[] = [{ type: "seasonCompleted", summary }];

  if (development.player.age > state.retirementAge) {
    events.push({ type: "careerEnded", reason: "ageLimit" });

    return {
      state: Object.freeze({
        ...state,
        status: "retired" as const,
        player: development.player,
        season: Object.freeze({ ...season, phase: "ended" as const }),
        history,
        actionLog,
      }),
      events: Object.freeze(events),
    };
  }

  return {
    state: Object.freeze({
      ...state,
      player: development.player,
      season: createSeason(
        state.seed,
        development.player,
        season.index + 1,
        season.clubId,
      ),
      history,
      actionLog,
    }),
    events: Object.freeze(events),
  };
}

/**
 * Applies one action and returns the new state plus the events it produced.
 *
 * The input state is never mutated. An action that does not fit the current
 * phase throws `InvalidActionError` rather than being silently ignored, because
 * a save that skipped a step must not be replayable.
 */
export function applyAction(state: CareerState, action: CareerAction): EngineResult {
  if (state.status === "retired" || state.season.phase === "ended") {
    throw new InvalidActionError(
      "This career has ended and cannot accept further actions.",
    );
  }

  switch (action.type) {
    case "chooseDecision":
      return applyChooseDecision(state, action);
    case "playMoment":
      return applyPlayMoment(state, action);
    case "advanceSeason":
      return applyAdvanceSeason(state, action);
    default: {
      const unknown = action as { type?: unknown };
      throw new InvalidActionError(
        `Unknown action type ${JSON.stringify(unknown.type)}.`,
      );
    }
  }
}

/**
 * Rebuilds a career by replaying an action log against a seed.
 *
 * This is the verification path: given a submitted seed and log, a server can
 * recompute the final state and compare it with what the client claimed.
 */
export function replayCareer(
  seedInput: unknown,
  actions: readonly CareerAction[],
): EngineResult {
  let state = createCareer(seedInput);
  const events: CareerEvent[] = [];

  for (const action of actions) {
    const result = applyAction(state, action);
    state = result.state;
    events.push(...result.events);
  }

  return { state, events: Object.freeze(events) };
}

// ---------------------------------------------------------------------------
// Legacy inputs
// ---------------------------------------------------------------------------

/**
 * Aggregates the raw facts a Legacy Score is computed from.
 *
 * The weighting formula from the product spec is intentionally not applied
 * here. Scoring is balancing work and belongs to its own issue; the engine only
 * reports what happened.
 */
export function computeLegacyInput(state: CareerState): LegacyInput {
  const seasons = state.history;
  if (seasons.length === 0) {
    return Object.freeze({
      seasonsPlayed: 0,
      decisiveMoments: 0,
      poorMoments: 0,
      peakRating: 0,
      averageRating: 0,
      finalReputation: state.player.condition.reputation,
      totalGrowth: 0,
      clubsPlayedFor: 0,
    });
  }

  let decisiveMoments = 0;
  let poorMoments = 0;
  let peakRating = 0;
  let ratingTotal = 0;
  let totalGrowth = 0;
  const clubs = new Set<string>();

  for (const season of seasons) {
    if (season.momentOutcome === "decisive") {
      decisiveMoments += 1;
    }

    if (season.momentOutcome === "poor") {
      poorMoments += 1;
    }

    peakRating = Math.max(peakRating, season.rating);
    ratingTotal += season.rating;
    totalGrowth += season.growth;
    clubs.add(season.clubId);
  }

  return Object.freeze({
    seasonsPlayed: seasons.length,
    decisiveMoments,
    poorMoments,
    peakRating,
    averageRating: divide(ratingTotal, seasons.length),
    finalReputation: state.player.condition.reputation,
    totalGrowth,
    clubsPlayedFor: clubs.size,
  });
}
