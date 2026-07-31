/**
 * Synthetic world fixture.
 *
 * Every club and league here is invented. No licensed club, competition or
 * player data enters the repository, and the engine has no data provider
 * dependency. When a licensed snapshot is introduced it will be loaded through
 * an adapter that produces this same `WorldSnapshot` shape.
 */

import type { Club, League, WorldSnapshot } from "./types";

const leagues: readonly League[] = [
  { id: "lg-summit", name: "Summit League", tier: 1 },
  { id: "lg-harbour", name: "Harbour League", tier: 2 },
  { id: "lg-valley", name: "Valley League", tier: 3 },
];

const clubs: readonly Club[] = [
  { id: "cl-aurora", name: "Aurora Athletic", leagueId: "lg-summit", strength: 88 },
  { id: "cl-meridian", name: "Meridian City", leagueId: "lg-summit", strength: 84 },
  { id: "cl-crown", name: "Crown Rovers", leagueId: "lg-summit", strength: 79 },
  { id: "cl-vertex", name: "Vertex United", leagueId: "lg-summit", strength: 73 },
  { id: "cl-lantern", name: "Lantern FC", leagueId: "lg-harbour", strength: 66 },
  { id: "cl-quarry", name: "Quarry Town", leagueId: "lg-harbour", strength: 61 },
  { id: "cl-tidal", name: "Tidal Wanderers", leagueId: "lg-harbour", strength: 57 },
  { id: "cl-foundry", name: "Foundry Park", leagueId: "lg-harbour", strength: 52 },
  { id: "cl-willow", name: "Willowbank", leagueId: "lg-valley", strength: 44 },
  { id: "cl-orchard", name: "Orchard Road", leagueId: "lg-valley", strength: 39 },
  { id: "cl-pinefield", name: "Pinefield County", leagueId: "lg-valley", strength: 34 },
  { id: "cl-stonebridge", name: "Stonebridge", leagueId: "lg-valley", strength: 29 },
];

/** The V1 synthetic world. Frozen so no caller can mutate shared fixtures. */
export const syntheticWorld: WorldSnapshot = Object.freeze({
  id: "synthetic-v1",
  leagues: Object.freeze(leagues.map((league) => Object.freeze(league))),
  clubs: Object.freeze(clubs.map((club) => Object.freeze(club))),
});

export function findClub(world: WorldSnapshot, clubId: string): Club | null {
  return world.clubs.find((club) => club.id === clubId) ?? null;
}

export function findLeague(world: WorldSnapshot, leagueId: string): League | null {
  return world.leagues.find((league) => league.id === leagueId) ?? null;
}

/**
 * Clubs ordered from weakest to strongest.
 *
 * Ordering is explicit rather than relying on the declaration order, because
 * career progression compares clubs by strength and ties must resolve the same
 * way on every run. Club id is the tie breaker.
 */
export function clubsByStrength(world: WorldSnapshot): readonly Club[] {
  return [...world.clubs].sort((left, right) => {
    if (left.strength !== right.strength) {
      return left.strength - right.strength;
    }

    return left.id < right.id ? -1 : 1;
  });
}
