import type { CareerState } from "@/engine";
import { findClub, findLeague, syntheticWorld } from "@/engine";
import type { PlayDictionary } from "@/i18n/dictionaries";
import { SLICE_SEASONS, conditionKeys } from "@/slice/journal";

import styles from "../play.module.css";

type HudProps = {
  state: CareerState;
  seasonNumber: number;
  play: PlayDictionary;
};

/** Persistent status bar: where the player is, and how they are doing. */
export function Hud({ state, seasonNumber, play }: HudProps) {
  const club = findClub(syntheticWorld, state.season.clubId);
  const league = club ? findLeague(syntheticWorld, club.leagueId) : null;

  return (
    <section className={styles.hud} aria-label={play.hud.seasonProgress}>
      <div className={styles.hudItem}>
        <span className={styles.hudLabel}>{play.hud.seasonProgress}</span>
        <span className={styles.hudValue} data-testid="hud-season">
          {seasonNumber} / {SLICE_SEASONS}
        </span>
      </div>
      <div className={styles.hudItem}>
        <span className={styles.hudLabel}>{play.hud.age}</span>
        <span className={styles.hudValue}>{state.player.age}</span>
      </div>
      <div className={styles.hudItem}>
        <span className={styles.hudLabel}>{play.hud.club}</span>
        <span className={styles.hudValue} data-testid="hud-club">
          {club?.name ?? "—"}
        </span>
      </div>
      <div className={styles.hudItem}>
        <span className={styles.hudLabel}>{play.hud.league}</span>
        <span className={styles.hudValue}>{league?.name ?? "—"}</span>
      </div>

      <div className={styles.meters} style={{ gridColumn: "1 / -1" }}>
        {conditionKeys.map((key) => (
          <div className={styles.meter} key={key}>
            <span className={styles.meterHead}>
              {play.condition[key]}
              <span className={styles.meterValue} data-testid={`meter-${key}`}>
                {state.player.condition[key]}
              </span>
            </span>
            <span className={styles.meterTrack}>
              <span
                className={styles.meterFill}
                style={{ width: `${state.player.condition[key]}%` }}
              />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
