/**
 * Engine errors.
 *
 * Every failure the engine can produce is one of these, carries a machine
 * readable `code`, and explains what was received versus what is supported.
 * A save from a future build must fail loudly rather than be silently coerced
 * into a shape the current rules do not understand.
 */

export type EngineErrorCode =
  | "UNSUPPORTED_SEED_VERSION"
  | "UNSUPPORTED_STATE_VERSION"
  | "INVALID_SEED"
  | "INVALID_STATE"
  | "INVALID_ACTION";

export class EngineError extends Error {
  readonly code: EngineErrorCode;

  constructor(code: EngineErrorCode, message: string) {
    super(message);
    this.name = "EngineError";
    this.code = code;
  }
}

export class UnsupportedVersionError extends EngineError {
  readonly received: unknown;
  readonly supported: number;

  constructor(
    code: "UNSUPPORTED_SEED_VERSION" | "UNSUPPORTED_STATE_VERSION",
    subject: string,
    received: unknown,
    supported: number,
  ) {
    super(
      code,
      `Unsupported ${subject} version: received ${describe(received)}, this build supports version ${supported}. ` +
        `Upgrade the application, or start a new career.`,
    );
    this.name = "UnsupportedVersionError";
    this.received = received;
    this.supported = supported;
  }
}

export class InvalidSeedError extends EngineError {
  constructor(message: string) {
    super("INVALID_SEED", `Invalid career seed: ${message}`);
    this.name = "InvalidSeedError";
  }
}

export class InvalidStateError extends EngineError {
  constructor(message: string) {
    super("INVALID_STATE", `Invalid career state: ${message}`);
    this.name = "InvalidStateError";
  }
}

export class InvalidActionError extends EngineError {
  constructor(message: string) {
    super("INVALID_ACTION", `Invalid career action: ${message}`);
    this.name = "InvalidActionError";
  }
}

/** Renders an unknown value for an error message without throwing on it. */
export function describe(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return typeof value;
}
