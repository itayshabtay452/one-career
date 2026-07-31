"use client";

import { useId, useState, type FormEvent } from "react";

import type { PlayDictionary } from "@/i18n/dictionaries";

import styles from "../play.module.css";

type CreateScreenProps = {
  play: PlayDictionary;
  /** Message from a saved run that could not be restored, if any. */
  notice: string | null;
  onStart: (identity: { playerName: string; nationality: string }) => void;
};

export function CreateScreen({ play, notice, onStart }: CreateScreenProps) {
  const nameId = useId();
  const nationalityId = useId();
  const roleId = useId();
  const roleNoteId = useId();
  const [playerName, setPlayerName] = useState("");
  const [nationality, setNationality] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (playerName.trim().length === 0) {
      setError(play.create.nameError);
      return;
    }

    if (nationality.trim().length === 0) {
      setError(play.create.nationalityError);
      return;
    }

    setError(null);
    onStart({ playerName, nationality });
  };

  return (
    <section className={styles.card} aria-labelledby="create-heading">
      <h1 className={styles.heading} id="create-heading">
        {play.create.heading}
      </h1>
      <p className={styles.subheading}>{play.create.intro}</p>

      {notice ? (
        <p className={styles.error} role="alert" data-testid="save-notice">
          {notice}
        </p>
      ) : null}

      <form onSubmit={submit} noValidate>
        {error ? (
          <p className={styles.error} role="alert" data-testid="create-error">
            {error}
          </p>
        ) : null}

        <div className={styles.field}>
          <label className={styles.label} htmlFor={nameId}>
            {play.create.nameLabel}
          </label>
          <input
            className={styles.input}
            id={nameId}
            name="playerName"
            type="text"
            maxLength={40}
            autoComplete="off"
            placeholder={play.create.namePlaceholder}
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={nationalityId}>
            {play.create.nationalityLabel}
          </label>
          <input
            className={styles.input}
            id={nationalityId}
            name="nationality"
            type="text"
            maxLength={40}
            autoComplete="off"
            placeholder={play.create.nationalityPlaceholder}
            value={nationality}
            onChange={(event) => setNationality(event.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label} id={roleId}>
            {play.create.roleLabel}
          </span>
          <p className={styles.readonlyValue} aria-labelledby={roleId} aria-describedby={roleNoteId}>
            {play.create.roleValue}
          </p>
          <p className={styles.hint} id={roleNoteId}>
            {play.create.roleNote}
          </p>
        </div>

        <div className={styles.actions}>
          <button className={styles.primary} type="submit" data-testid="start-slice">
            {play.create.start}
          </button>
        </div>
      </form>
    </section>
  );
}
