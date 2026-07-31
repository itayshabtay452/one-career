"use client";

import type { PlayDictionary } from "@/i18n/dictionaries";
import {
  attributeChanges,
  conditionChanges,
  type SeasonRecord,
} from "@/slice/journal";

import styles from "../play.module.css";

type SummaryScreenProps = {
  record: SeasonRecord;
  play: PlayDictionary;
  isLastSeason: boolean;
  onContinue: () => void;
};

const OUTCOME_STYLE = {
  decisive: styles.resultDecisive,
  positive: styles.resultPositive,
  neutral: "",
  poor: styles.resultPoor,
} as const;

/**
 * What happened, and why.
 *
 * The product spec asks for short feedback that names what decided the moment,
 * and for the player to see at least one attribute and one dynamic value move.
 * Both come straight from the engine rather than being narrated separately, so
 * the text can never drift from the numbers.
 */
export function SummaryScreen({
  record,
  play,
  isLastSeason,
  onContinue,
}: SummaryScreenProps) {
  const attributes = attributeChanges(record);
  const condition = conditionChanges(record);
  const hasChanges = attributes.length > 0 || condition.length > 0;

  return (
    <section className={styles.card} aria-labelledby="summary-heading">
      <h1 className={styles.heading} id="summary-heading">
        {play.summary.heading}
      </h1>

      <p
        className={`${styles.resultBadge} ${OUTCOME_STYLE[record.result.outcome]}`}
        data-testid="summary-outcome"
      >
        {play.summary.outcomeLabel}: {play.outcomes[record.result.outcome]}
      </p>

      <p className={styles.subheading} data-testid="summary-why">
        {play.summary.whyLabel}: {play.factors[record.result.decidingFactor]}.
      </p>

      <div className={styles.statRow}>
        <p className={styles.stat}>
          <span className={styles.statLabel}>{play.summary.scoreLabel}</span>
          <span className={styles.statValue}>{record.result.score}</span>
        </p>
        <p className={styles.stat}>
          <span className={styles.statLabel}>{play.summary.ratingLabel}</span>
          <span className={styles.statValue} data-testid="summary-rating">
            {record.summary.rating}
          </span>
        </p>
      </div>

      <h2 className={styles.changeHeading}>{play.summary.changesHeading}</h2>

      {hasChanges ? null : <p className={styles.hint}>{play.summary.noChange}</p>}

      {attributes.length > 0 ? (
        <div className={styles.changeGroup}>
          <h3 className={styles.changeHeading}>{play.summary.attributeHeading}</h3>
          <ul className={styles.changeList} data-testid="attribute-changes">
            {attributes.map((change) => (
              <li className={styles.changeItem} key={change.key}>
                <span>
                  {play.attributes[change.key]} · {change.before} → {change.after}
                </span>
                <span
                  className={`${styles.changeDelta} ${
                    change.delta > 0 ? styles.deltaUp : styles.deltaDown
                  }`}
                >
                  {change.delta > 0 ? "+" : ""}
                  {change.delta}
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.hint}>{play.summary.growthExplained}</p>
        </div>
      ) : null}

      {condition.length > 0 ? (
        <div className={styles.changeGroup}>
          <h3 className={styles.changeHeading}>{play.summary.conditionHeading}</h3>
          <ul className={styles.changeList} data-testid="condition-changes">
            {condition.map((change) => (
              <li className={styles.changeItem} key={change.key}>
                <span>
                  {play.condition[change.key]} · {change.before} → {change.after}
                </span>
                <span
                  className={`${styles.changeDelta} ${
                    change.delta > 0 ? styles.deltaUp : styles.deltaDown
                  }`}
                >
                  {change.delta > 0 ? "+" : ""}
                  {change.delta}
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.hint}>{play.summary.conditionExplained}</p>
        </div>
      ) : null}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={onContinue}
          data-testid="summary-continue"
        >
          {isLastSeason ? play.summary.finish : play.summary.nextSeason}
        </button>
      </div>
    </section>
  );
}
