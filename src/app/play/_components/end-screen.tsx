"use client";

import { computeLegacyInput, findClub, syntheticWorld } from "@/engine";
import type { PlayDictionary } from "@/i18n/dictionaries";
import { decisionImpact, type SliceRun } from "@/slice/journal";
import { computeProvisionalLegacy } from "@/slice/legacy";

import styles from "../play.module.css";

type EndScreenProps = {
  run: SliceRun;
  play: PlayDictionary;
  onRestart: () => void;
};

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export function EndScreen({ run, play, onRestart }: EndScreenProps) {
  const legacy = computeProvisionalLegacy(computeLegacyInput(run.state));
  const impact = decisionImpact(run);

  const impactText = (() => {
    if (impact.kind === "transfer") {
      const club = findClub(syntheticWorld, impact.clubId);
      return fill(play.end.impactTransfer, {
        season: impact.season,
        club: club?.name ?? impact.clubId,
      });
    }

    if (impact.kind === "focus") {
      return fill(play.end.impactFocus, {
        season: impact.season,
        attribute: play.attributes[impact.attribute],
        points: impact.points,
      });
    }

    return play.end.impactNone;
  })();

  return (
    <section className={styles.card} aria-labelledby="end-heading">
      <h1 className={styles.heading} id="end-heading">
        {play.end.heading}
      </h1>
      <p className={styles.subheading}>{play.end.intro}</p>

      <div className={styles.legacyBlock}>
        <span className={styles.hudLabel}>{play.end.legacyLabel}</span>
        <span className={styles.legacyScore} data-testid="legacy-score">
          {legacy.score}
        </span>
        <span className={styles.legacyScale}>{play.end.legacyScale}</span>
        <span className={styles.legacyTitle} data-testid="legacy-title">
          {play.endTitles[legacy.titleKey]}
        </span>
      </div>

      <p className={styles.hint} style={{ marginBottom: "18px" }}>
        {play.end.provisional}
      </p>

      <h2 className={styles.changeHeading}>{play.end.impactHeading}</h2>
      <p className={styles.impact} data-testid="decision-impact">
        {impactText}
      </p>

      <h2 className={styles.changeHeading}>{play.end.timelineHeading}</h2>
      <ol className={styles.timeline} data-testid="timeline">
        {run.records.map((record) => {
          const club = findClub(syntheticWorld, record.summary.clubId);
          return (
            <li className={styles.timelineItem} key={record.summary.index}>
              <span className={styles.timelineHead}>
                <span>
                  {record.summary.year} · {play.hud.age} {record.summary.age}
                </span>
                <span>
                  {play.summary.ratingLabel} {record.summary.rating}
                </span>
              </span>
              <p className={styles.timelineBody}>
                {club?.name ?? record.summary.clubId} ·{" "}
                {play.decisionKinds[record.decision.kind].title} ·{" "}
                {play.outcomes[record.result.outcome]}
              </p>
            </li>
          );
        })}
      </ol>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={onRestart}
          data-testid="restart-slice"
        >
          {play.end.restart}
        </button>
      </div>
    </section>
  );
}
