"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import { STATE_VERSION, type CareerAction, type CareerSeed, type MomentInput } from "@/engine";
import { defaultLocale } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";
import { SLICE_SEASONS, buildRun } from "@/slice/journal";
import {
  createSliceSeed,
  generateSeedText,
  parseSavedPayload,
} from "@/slice/storage";
import {
  hydrationStore,
  readSave,
  readServerSave,
  subscribeToSave,
  writeSave,
} from "@/slice/store";

import styles from "../play.module.css";
import { CreateScreen } from "./create-screen";
import { DecisionScreen } from "./decision-screen";
import { EndScreen } from "./end-screen";
import { Hud } from "./hud";
import { MomentScreen } from "./moment-screen";
import { SummaryScreen } from "./summary-screen";

const ADVANCE: CareerAction = { type: "advanceSeason" };

/** Builds the save payload. Same shape the engine's `toCareerSave` produces. */
function encode(seed: CareerSeed, actionLog: readonly CareerAction[]): string {
  return JSON.stringify({ version: STATE_VERSION, seed, actionLog });
}

/**
 * The slice orchestrator.
 *
 * The saved payload is the single source of truth: every screen is derived by
 * replaying the seed and the action log through the engine, and every player
 * action appends to that log and writes it back. Reloading the page therefore
 * restores exactly the run that was played, because there is no second copy of
 * the state that could disagree with the save.
 */
export function PlayClient() {
  const play = dictionaries[defaultLocale].play;
  const home = dictionaries[defaultLocale].home;

  const hydrated = useSyncExternalStore(
    hydrationStore.subscribe,
    hydrationStore.getSnapshot,
    hydrationStore.getServerSnapshot,
  );
  const raw = useSyncExternalStore(subscribeToSave, readSave, readServerSave);
  const [startedThisSession, setStartedThisSession] = useState(false);

  const saved = useMemo(() => parseSavedPayload(raw), [raw]);
  const run = saved.status === "ok" ? saved.run : null;

  // The season summary describes a season that is already closed, so it is
  // rendered from a preview of the advance rather than from the live state.
  // Replaying is pure, so previewing and then committing give the same result.
  const summaryRun = useMemo(() => {
    if (!run || run.state.season.phase !== "summary") {
      return null;
    }

    return buildRun(run.state.seed, [...run.state.actionLog, ADVANCE]);
  }, [run]);

  const append = (action: CareerAction) => {
    if (!run) {
      return;
    }

    writeSave(encode(run.state.seed, [...run.state.actionLog, action]));
  };

  const start = (identity: { playerName: string; nationality: string }) => {
    setStartedThisSession(true);
    writeSave(encode(createSliceSeed(identity, generateSeedText()), []));
  };

  const restart = () => {
    setStartedThisSession(false);
    writeSave(null);
  };

  const header = (
    <div className={styles.topbar}>
      <Link className={styles.backLink} href="/">
        ← {play.backHome}
      </Link>
      <span className={styles.sliceBadge}>{play.sliceBadge}</span>
    </div>
  );

  if (!hydrated) {
    return (
      <main className={styles.shell}>
        {header}
        <p className={styles.note}>{play.loading}</p>
      </main>
    );
  }

  if (!run) {
    const notice =
      saved.status === "unsupported"
        ? play.saved.unsupported
        : saved.status === "broken"
          ? play.saved.broken
          : null;

    return (
      <main className={styles.shell}>
        {header}
        <p className={styles.note}>{play.sliceNote}</p>
        <CreateScreen play={play} notice={notice} onStart={start} />
      </main>
    );
  }

  const seasonNumber = Math.min(run.records.length + 1, SLICE_SEASONS);
  const finished = run.complete;
  const summaryRecord = summaryRun?.records[summaryRun.records.length - 1];

  return (
    <main className={styles.shell}>
      {header}

      <span className={styles.visuallyHidden}>
        {home.brandName} · {play.sliceNote}
      </span>

      {/* The summary carries every number for the season that just closed, so
          showing the live HUD beside it would contradict it. */}
      {finished || summaryRecord ? null : (
        <Hud state={run.state} seasonNumber={seasonNumber} play={play} />
      )}

      {!startedThisSession && !finished && run.state.actionLog.length > 0 ? (
        <p className={styles.notice} data-testid="restored-notice">
          {play.saved.restored}
        </p>
      ) : null}

      {finished ? <EndScreen run={run} play={play} onRestart={restart} /> : null}

      {!finished && run.state.season.phase === "decision" ? (
        <DecisionScreen
          decisions={run.state.season.decisions}
          seasonNumber={seasonNumber}
          play={play}
          onChoose={(decisionId) => append({ type: "chooseDecision", decisionId })}
        />
      ) : null}

      {!finished && run.state.season.phase === "moment" ? (
        <MomentScreen
          prompt={run.state.season.moment}
          play={play}
          onPlay={(input: MomentInput) => append({ type: "playMoment", input })}
        />
      ) : null}

      {!finished && summaryRecord ? (
        <SummaryScreen
          record={summaryRecord}
          play={play}
          isLastSeason={summaryRun !== null && summaryRun.records.length >= SLICE_SEASONS}
          onContinue={() => append(ADVANCE)}
        />
      ) : null}

      {finished ? null : (
        <button type="button" className={styles.ghost} onClick={restart}>
          {play.saved.startOver}
        </button>
      )}
    </main>
  );
}
