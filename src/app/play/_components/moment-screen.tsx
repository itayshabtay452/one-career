"use client";

import { useId, useState } from "react";

import type { MomentChoice, MomentInput, MomentPrompt } from "@/engine";
import type { PlayDictionary } from "@/i18n/dictionaries";

import styles from "../play.module.css";
import { PitchView } from "./pitch-view";
import { TimingBar } from "./timing-bar";

type MomentStep = "read" | "choose" | "execute";

const CHOICES: readonly MomentChoice[] = ["shoot", "pass", "dribble", "tackle"];

type MomentScreenProps = {
  prompt: MomentPrompt;
  play: PlayDictionary;
  onPlay: (input: MomentInput) => void;
};

function pressureWording(pressure: number, play: PlayDictionary): string {
  if (pressure >= 67) {
    return play.moment.pressureHigh;
  }

  return pressure >= 34 ? play.moment.pressureMedium : play.moment.pressureLow;
}

/**
 * The Read, Choose, Execute moment from the product spec.
 *
 * Every value handed to the engine is a bounded integer: the direction is one
 * of five, the power is a slider step and the timing is quantised by the timing
 * bar. Nothing here reveals the ideal answer before the player commits, and no
 * success rate is shown at any point.
 */
export function MomentScreen({ prompt, play, onPlay }: MomentScreenProps) {
  const [step, setStep] = useState<MomentStep>("read");
  const [choice, setChoice] = useState<MomentChoice | null>(null);
  const [direction, setDirection] = useState(0);
  const [power, setPower] = useState(50);
  const [timing, setTiming] = useState<number | null>(null);

  const directionName = useId();
  const powerId = useId();
  const powerHintId = useId();
  const timingHintId = useId();
  const kindCopy = play.momentKinds[prompt.kind];

  const steps: ReadonlyArray<{ id: MomentStep; label: string }> = [
    { id: "read", label: play.moment.stepRead },
    { id: "choose", label: play.moment.stepChoose },
    { id: "execute", label: play.moment.stepExecute },
  ];

  return (
    <section className={styles.card} aria-labelledby="moment-heading">
      <ol className={styles.steps}>
        {steps.map((entry) => (
          <li
            key={entry.id}
            className={`${styles.step} ${step === entry.id ? styles.stepActive : ""}`}
            aria-current={step === entry.id ? "step" : undefined}
          >
            {entry.label}
          </li>
        ))}
      </ol>

      {step === "read" ? (
        <>
          <h1 className={styles.heading} id="moment-heading">
            {play.moment.readHeading}
          </h1>
          <p className={styles.subheading}>{play.moment.readIntro}</p>
          <PitchView
            kind={prompt.kind}
            pressure={prompt.pressure}
            label={play.moment.pitchLabel}
          />
          <p className={styles.optionTitle} data-testid="moment-kind">
            {kindCopy.title}
          </p>
          <p className={styles.subheading}>{kindCopy.situation}</p>
          <p className={styles.hint} data-testid="moment-pressure">
            {play.moment.pressureLabel}: {pressureWording(prompt.pressure, play)}
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => setStep("choose")}
              data-testid="moment-read-continue"
            >
              {play.moment.readContinue}
            </button>
          </div>
        </>
      ) : null}

      {step === "choose" ? (
        <>
          <h1 className={styles.heading} id="moment-heading">
            {play.moment.chooseHeading}
          </h1>
          <p className={styles.subheading}>{play.moment.chooseIntro}</p>
          <div className={styles.choiceGrid}>
            {CHOICES.map((option) => (
              <button
                key={option}
                type="button"
                className={styles.choice}
                onClick={() => {
                  setChoice(option);
                  setStep("execute");
                }}
                data-testid={`moment-choice-${option}`}
              >
                {play.momentChoices[option]}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {step === "execute" && choice ? (
        <>
          <h1 className={styles.heading} id="moment-heading">
            {play.moment.executeHeading}
          </h1>
          <p className={styles.subheading}>{play.moment.executeIntro}</p>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{play.moment.directionLabel}</legend>
            <p className={styles.hint}>{play.moment.directionHint}</p>
            <div className={styles.directionRow}>
              {play.directions.map((label, index) => {
                const value = index - 2;
                return (
                  <span className={styles.directionOption} key={label}>
                    <input
                      className={styles.directionInput}
                      type="radio"
                      id={`${directionName}-${index}`}
                      name={directionName}
                      value={value}
                      checked={direction === value}
                      onChange={() => setDirection(value)}
                    />
                    <label
                      className={styles.directionLabel}
                      htmlFor={`${directionName}-${index}`}
                      data-testid={`direction-${value}`}
                    >
                      {label}
                    </label>
                  </span>
                );
              })}
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              {play.moment.powerLabel}:{" "}
              <span className={styles.sliderValue} data-testid="power-value">
                {power}
              </span>
            </legend>
            <p className={styles.hint} id={powerHintId}>
              {play.moment.powerHint}
            </p>
            <input
              className={styles.slider}
              id={powerId}
              type="range"
              min={0}
              max={100}
              step={1}
              value={power}
              aria-describedby={powerHintId}
              aria-label={play.moment.powerLabel}
              onChange={(event) => setPower(Number(event.target.value))}
              data-testid="power-slider"
            />
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{play.moment.timingLabel}</legend>
            <p className={styles.hint} id={timingHintId}>
              {play.moment.timingHint}
            </p>
            <TimingBar
              labels={{
                start: play.moment.timingStart,
                stop: play.moment.timingStop,
                locked: play.moment.timingLocked,
                value: play.moment.timingValue,
              }}
              describedBy={timingHintId}
              value={timing}
              onChange={setTiming}
            />
          </fieldset>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              disabled={timing === null}
              onClick={() =>
                onPlay({ choice, direction, power, timing: timing ?? 0 })
              }
              data-testid="moment-submit"
            >
              {play.moment.submit}
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                setChoice(null);
                setStep("choose");
              }}
            >
              {play.moment.changeChoice}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
