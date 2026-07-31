/**
 * Season by season record of a slice run.
 *
 * The engine deliberately stores only what the rules need: a `SeasonSummary`
 * knows the rating and the total growth, but not which attributes moved or
 * which option produced them. The player needs exactly that, so the slice
 * rebuilds it by replaying the action log and taking a snapshot on either side
 * of every season.
 *
 * This lives outside `src/engine` on purpose. It is presentation detail, and
 * adding it to the engine would change a contract that is already locked by
 * regression tests.
 */

import {
  applyAction,
  attributeKeys,
  createCareer,
  type AttributeKey,
  type Attributes,
  type CareerAction,
  type CareerDecision,
  type CareerSeed,
  type CareerState,
  type Condition,
  type MomentPrompt,
  type MomentResult,
  type SeasonSummary,
} from "@/engine";

/** Seasons the vertical slice plays before it stops. */
export const SLICE_SEASONS = 3;

/** The calendar year every slice run starts in. Fixed, never read from a clock. */
export const SLICE_START_YEAR = 2026;

export type ConditionKey = keyof Condition;

export const conditionKeys: readonly ConditionKey[] = [
  "fitness",
  "morale",
  "sharpness",
  "reputation",
];

export type SeasonRecord = {
  decision: CareerDecision;
  prompt: MomentPrompt;
  result: MomentResult;
  summary: SeasonSummary;
  attributesBefore: Attributes;
  attributesAfter: Attributes;
  conditionBefore: Condition;
  conditionAfter: Condition;
};

export type SliceRun = {
  state: CareerState;
  records: readonly SeasonRecord[];
  /** True once the slice has played its seasons, or the career ended early. */
  complete: boolean;
};

type PartialRecord = {
  decision?: CareerDecision;
  prompt?: MomentPrompt;
  result?: MomentResult;
};

/**
 * Replays an action log and records what the player needs to see.
 *
 * Errors from the engine are not swallowed: an action log that does not form a
 * legal career must fail here rather than render a half built screen.
 */
export function buildRun(
  seed: CareerSeed,
  actionLog: readonly CareerAction[],
): SliceRun {
  let state = createCareer(seed);
  const records: SeasonRecord[] = [];
  let pending: PartialRecord = {};

  for (const action of actionLog) {
    if (action.type === "chooseDecision") {
      pending.decision = state.season.decisions.find(
        (option) => option.id === action.decisionId,
      );
      pending.prompt = state.season.moment;
    }

    const attributesBefore = state.player.attributes;
    const conditionBefore = state.player.condition;
    const next = applyAction(state, action).state;

    if (action.type === "playMoment") {
      pending.result = next.season.momentResult ?? undefined;
    }

    if (action.type === "advanceSeason") {
      const summary = next.history.at(-1);
      if (summary && pending.decision && pending.prompt && pending.result) {
        records.push({
          decision: pending.decision,
          prompt: pending.prompt,
          result: pending.result,
          summary,
          attributesBefore,
          attributesAfter: next.player.attributes,
          conditionBefore,
          conditionAfter: next.player.condition,
        });
      }

      pending = {};
    }

    state = next;
  }

  return {
    state,
    records,
    complete: records.length >= SLICE_SEASONS || state.season.phase === "ended",
  };
}

export type AttributeChange = {
  key: AttributeKey;
  before: number;
  after: number;
  delta: number;
};

export type ConditionChange = {
  key: ConditionKey;
  before: number;
  after: number;
  delta: number;
};

/** Attributes that moved this season, largest gain first. */
export function attributeChanges(record: SeasonRecord): readonly AttributeChange[] {
  return attributeKeys
    .map((key) => ({
      key,
      before: record.attributesBefore[key],
      after: record.attributesAfter[key],
      delta: record.attributesAfter[key] - record.attributesBefore[key],
    }))
    .filter((change) => change.delta !== 0)
    .sort((left, right) => right.delta - left.delta);
}

/** Dynamic values that moved this season, largest gain first. */
export function conditionChanges(record: SeasonRecord): readonly ConditionChange[] {
  return conditionKeys
    .map((key) => ({
      key,
      before: record.conditionBefore[key],
      after: record.conditionAfter[key],
      delta: record.conditionAfter[key] - record.conditionBefore[key],
    }))
    .filter((change) => change.delta !== 0)
    .sort((left, right) => right.delta - left.delta);
}

export type DecisionImpact =
  | { kind: "none" }
  | { kind: "transfer"; season: number; clubId: string }
  | { kind: "focus"; season: number; attribute: AttributeKey; points: number };

/**
 * Finds one earlier choice whose effect is still visible later in the run.
 *
 * A transfer is the clearest case: the club changed and stayed changed. If the
 * player never moved, the next best evidence is the attribute their training
 * focus grew the most across the seasons that followed it.
 */
export function decisionImpact(run: SliceRun): DecisionImpact {
  const records = run.records;

  for (const [index, record] of records.entries()) {
    const isLast = index === records.length - 1;
    if (record.decision.kind === "transfer" && record.decision.clubId && !isLast) {
      return {
        kind: "transfer",
        season: record.summary.index + 1,
        clubId: record.decision.clubId,
      };
    }
  }

  let best: DecisionImpact = { kind: "none" };
  let bestPoints = 0;

  for (const [index, record] of records.entries()) {
    const focus = record.decision.focus;
    if (!focus || index === records.length - 1) {
      continue;
    }

    const last = records[records.length - 1];
    if (!last) {
      continue;
    }

    const points = last.attributesAfter[focus] - record.attributesBefore[focus];
    if (points > bestPoints) {
      bestPoints = points;
      best = {
        kind: "focus",
        season: record.summary.index + 1,
        attribute: focus,
        points,
      };
    }
  }

  return best;
}
