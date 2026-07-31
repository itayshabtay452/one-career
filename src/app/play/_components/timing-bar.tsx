"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "../play.module.css";

/** One full sweep of the marker, in milliseconds. */
const SWEEP_MS = 1900;

type TimingBarProps = {
  labels: {
    start: string;
    stop: string;
    locked: string;
    value: string;
  };
  describedBy: string;
  /** Locked timing on the engine scale, -100..100, or null while unset. */
  value: number | null;
  onChange: (timing: number) => void;
};

/**
 * Converts a swinging marker into one discrete integer.
 *
 * The animation may run at whatever frame rate the device offers; only the
 * quantised value ever reaches the engine, which is exactly the split ADR-003
 * asks for. The control is fully keyboard operable: the same button starts and
 * stops the sweep, so Space or Enter is enough to play a moment.
 */
export function TimingBar({ labels, describedBy, value, onChange }: TimingBarProps) {
  const [running, setRunning] = useState(false);
  const [position, setPosition] = useState(0.5);
  const frameRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    setRunning(false);
    setPosition((current) => {
      // -100..100, where 0 is dead centre.
      onChange(Math.round((current - 0.5) * 200));
      return current;
    });
  }, [onChange]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const tick = (now: number) => {
      if (startedAtRef.current === 0) {
        startedAtRef.current = now;
      }

      const elapsed = (now - startedAtRef.current) % SWEEP_MS;
      const phase = elapsed / SWEEP_MS;
      // Triangle wave: sweep across and back so both edges are reachable.
      setPosition(phase < 0.5 ? phase * 2 : 2 - phase * 2);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [running]);

  const start = () => {
    startedAtRef.current = 0;
    setRunning(true);
  };

  const markerPosition = value !== null && !running ? value / 200 + 0.5 : position;

  return (
    <div>
      <div className={styles.timingTrack} aria-hidden="true">
        <div className={styles.timingTarget} />
        <div className={styles.timingCentre} />
        <div
          className={`${styles.timingMarker} ${
            value !== null && !running ? styles.timingMarkerLocked : ""
          }`}
          style={{ left: `calc(${(markerPosition * 100).toFixed(2)}% - 2.5px)` }}
        />
      </div>

      <div className={styles.timingRow}>
        <button
          type="button"
          className={styles.secondary}
          onClick={running ? stop : start}
          aria-describedby={describedBy}
          data-testid={running ? "timing-stop" : "timing-start"}
        >
          {running ? labels.stop : labels.start}
        </button>
        <p className={styles.hint} role="status" data-testid="timing-value">
          {value === null || running
            ? ""
            : `${labels.locked} · ${labels.value}: ${value}`}
        </p>
      </div>
    </div>
  );
}
