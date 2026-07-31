/**
 * Deterministic random number generation.
 *
 * Three rules make replays reproducible across devices and engines:
 *
 * 1. Integers only. Every draw is a uint32 combined with `Math.imul`, shifts
 *    and `|0`, all of which are exactly specified by ECMAScript. The engine
 *    never consumes a floating point random value, so no result can depend on
 *    floating point rounding.
 * 2. Named streams. A draw is addressed by `(seedText, channel, index)` rather
 *    than by its position in one global sequence. Adding a new draw to one
 *    channel cannot shift the values another channel receives.
 * 3. Unbiased bounds. `intBelow` uses rejection sampling instead of modulo, so
 *    the distribution does not depend on the bound.
 */

/** Stream names. Each one is an independent sequence for a given seed. */
export type RngChannel =
  | "academy"
  | "world"
  | "decisions"
  | "moment"
  | "development";

export type Rng = {
  /** Next raw value, 0..2^32-1. */
  nextUint32(): number;
  /** Uniform integer in [0, bound). `bound` must be an integer >= 1. */
  intBelow(bound: number): number;
  /** Uniform integer in [min, max], inclusive on both ends. */
  intBetween(min: number, max: number): number;
  /** Uniform element of a non empty array. */
  pick<T>(values: readonly T[]): T;
};

/**
 * xmur3 string hash. Produces well mixed 32 bit seeds from a string.
 * Operates on UTF-16 code units, which is why seed text is restricted to a
 * canonical ASCII alphabet by `seed.ts`.
 */
function hashString(text: string): () => number {
  let h = 1779033703 ^ text.length;

  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/** Number of distinct values one draw can produce. */
const OUTPUT_RANGE = 0x100000000;

/** sfc32: 128 bit state, 32 bit output, integer only. */
function sfc32(seedA: number, seedB: number, seedC: number, seedD: number): Rng {
  let a = seedA >>> 0;
  let b = seedB >>> 0;
  let c = seedC >>> 0;
  let d = seedD >>> 0;

  const nextUint32 = (): number => {
    const sum = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    const mixed = (sum + d) | 0;
    c = (c + mixed) | 0;
    return mixed >>> 0;
  };

  const intBelow = (bound: number): number => {
    if (!Number.isInteger(bound) || bound < 1) {
      throw new RangeError(`intBelow requires a positive integer bound, got ${bound}.`);
    }

    // Above 2^32 the rejection limit below computes to 0, every draw is
    // rejected and the loop never ends. A single uint32 cannot cover such a
    // range anyway, so the bound is refused instead of hanging.
    if (bound > OUTPUT_RANGE) {
      throw new RangeError(
        `intBelow supports bounds up to ${OUTPUT_RANGE}, got ${bound}. A wider range needs more than one draw.`,
      );
    }

    if (bound === 1) {
      return 0;
    }

    // Rejection sampling: discard the values in the final partial bucket so
    // every outcome stays equally likely regardless of the bound.
    const limit = 0x100000000 - (0x100000000 % bound);
    let value = nextUint32();
    while (value >= limit) {
      value = nextUint32();
    }

    return value % bound;
  };

  const rng: Rng = {
    nextUint32,
    intBelow,
    intBetween(min, max) {
      if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new RangeError(`intBetween requires integers, got ${min} and ${max}.`);
      }

      if (max < min) {
        throw new RangeError(`intBetween requires max >= min, got ${min}..${max}.`);
      }

      const width = max - min + 1;
      if (width > OUTPUT_RANGE) {
        throw new RangeError(
          `intBetween supports a span of at most ${OUTPUT_RANGE} values, got ${width} for ${min}..${max}.`,
        );
      }

      return min + intBelow(width);
    },
    pick(values) {
      if (values.length === 0) {
        throw new RangeError("pick requires a non empty array.");
      }

      return values[intBelow(values.length)] as (typeof values)[number];
    },
  };

  return rng;
}

/**
 * Creates the stream for one `(seedText, channel, index)` address.
 *
 * `index` is normally the season index, so every season draws from a fresh,
 * independent stream and a mid career rule change cannot corrupt earlier
 * seasons of an in flight save.
 */
export function createRng(
  seedText: string,
  channel: RngChannel,
  index: number,
): Rng {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError(`Stream index must be a non negative integer, got ${index}.`);
  }

  const next = hashString(`one-career/1/${seedText}/${channel}/${index}`);
  const rng = sfc32(next(), next(), next(), next());

  // sfc32 is conventionally warmed up so the first outputs are well mixed.
  for (let i = 0; i < 12; i += 1) {
    rng.nextUint32();
  }

  return rng;
}
