"use client";

import type { CareerDecision } from "@/engine";
import { findClub, syntheticWorld } from "@/engine";
import type { PlayDictionary } from "@/i18n/dictionaries";

import styles from "../play.module.css";

type DecisionScreenProps = {
  decisions: readonly CareerDecision[];
  seasonNumber: number;
  play: PlayDictionary;
  onChoose: (decisionId: string) => void;
};

/** Turns the engine's numeric effects into short, honest labels. */
function effectTags(decision: CareerDecision, play: PlayDictionary) {
  const entries: Array<{ label: string; delta: number }> = [
    { label: play.condition.morale, delta: decision.effects.morale },
    { label: play.condition.sharpness, delta: decision.effects.sharpness },
    { label: play.condition.reputation, delta: decision.effects.reputation },
  ];

  return entries.filter((entry) => entry.delta !== 0);
}

export function DecisionScreen({
  decisions,
  seasonNumber,
  play,
  onChoose,
}: DecisionScreenProps) {
  return (
    <section className={styles.card} aria-labelledby="decision-heading">
      <h1 className={styles.heading} id="decision-heading">
        {play.decision.heading}
      </h1>
      <p className={styles.subheading}>{play.decision.intro}</p>

      <ul className={styles.optionList} data-testid="decision-list">
        {decisions.map((decision) => {
          const copy = play.decisionKinds[decision.kind];
          const club = decision.clubId
            ? findClub(syntheticWorld, decision.clubId)
            : null;

          return (
            <li key={decision.id}>
              <button
                type="button"
                className={styles.option}
                onClick={() => onChoose(decision.id)}
                data-testid={`decision-${decision.kind}`}
              >
                <span className={styles.optionTitle}>{copy.title}</span>
                <span className={styles.optionBody}>{copy.description}</span>

                <span className={styles.tagRow}>
                  {club ? (
                    <span className={styles.tag}>
                      {play.decision.movesTo} {club.name}
                    </span>
                  ) : null}
                  {decision.focus ? (
                    <span className={styles.tag}>
                      {play.decision.focusOn} {play.attributes[decision.focus]}
                    </span>
                  ) : null}
                  {effectTags(decision, play).map((tag) => (
                    <span
                      key={tag.label}
                      className={`${styles.tag} ${
                        tag.delta > 0 ? styles.tagPositive : styles.tagNegative
                      }`}
                    >
                      {tag.label} {tag.delta > 0 ? "+" : ""}
                      {tag.delta}
                    </span>
                  ))}
                </span>

                <span className={styles.visuallyHidden}>
                  {play.decision.choose} · {play.hud.seasonProgress} {seasonNumber}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
