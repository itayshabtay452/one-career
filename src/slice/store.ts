/**
 * The saved run as an external store.
 *
 * React reads this through `useSyncExternalStore`, which is what that hook
 * exists for: a value that lives outside React, is absent during server
 * rendering and must not be pulled in with a state update inside an effect.
 * Going through a store also removes the duplicate copy of the run that would
 * otherwise live in component state and drift from what is on disk.
 *
 * The module level cache mirrors one browser's `localStorage`, so a single
 * instance per document is correct. Pure helpers in `storage.ts` stay the
 * testable surface; this file only wires them to React.
 */

import { SAVE_KEY } from "./storage";

type Listener = () => void;

const listeners = new Set<Listener>();

let cached: string | null = null;
let loaded = false;

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToSave(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Current payload.
 *
 * The value is cached so repeated reads return an identical snapshot, which is
 * what `useSyncExternalStore` requires to avoid re-render loops.
 */
export function readSave(): string | null {
  if (!loaded) {
    cached = window.localStorage.getItem(SAVE_KEY);
    loaded = true;
  }

  return cached;
}

/** There is no saved run on the server, and none during hydration. */
export function readServerSave(): null {
  return null;
}

export function writeSave(raw: string | null): void {
  cached = raw;
  loaded = true;

  if (raw === null) {
    window.localStorage.removeItem(SAVE_KEY);
  } else {
    window.localStorage.setItem(SAVE_KEY, raw);
  }

  notify();
}

/** Nothing to subscribe to: hydration happens exactly once. */
function subscribeNever(): () => void {
  return () => {};
}

const alwaysTrue = () => true;
const alwaysFalse = () => false;

/**
 * Hydration flags for `useSyncExternalStore`.
 *
 * The server snapshot is `false` and the client snapshot is `true`, so a
 * component can render a neutral state until React has hydrated without
 * reaching for an effect.
 */
export const hydrationStore = {
  subscribe: subscribeNever,
  getSnapshot: alwaysTrue,
  getServerSnapshot: alwaysFalse,
};

/** Test seam: drops the cache so a fresh document starts clean. */
export function resetSaveCache(): void {
  cached = null;
  loaded = false;
}
