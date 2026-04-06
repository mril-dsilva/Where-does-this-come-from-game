import { getCountryByCode } from "../data/index.ts";
import { normalizeCountryKey } from "../data/normalize.ts";
import { resolveCountryMatch } from "../data/country-match.ts";
import type { Country, GameItem, GuessRecord } from "../../types/game.ts";
import { haversineKm } from "../geo/haversine.ts";
import { getHeatColorForDistance, getNeutralColorToken } from "./heat.ts";
import type { GuessHeatLevel } from "./heat.ts";

export type GuessResolution = {
  normalizedGuess: string;
  resolvedCountry: Country | null;
  didYouMeanCountry: Country | null;
  isDuplicate: boolean;
  isCorrect: boolean;
  distanceKm: number | null;
  heatColor: string;
  heatLevel: GuessHeatLevel;
  matchType: "exact" | "approximate" | "suggestion" | "unmatched";
};

function isDuplicateGuess(guesses: GuessRecord[], normalizedGuess: string, country: Country | null): boolean {
  return guesses.some((guess) => {
    if (guess.normalizedGuess === normalizedGuess) {
      return true;
    }

    return country ? guess.countryCode === country.code : false;
  });
}

export function createGuessRecord(params: {
  guess: string;
  country: Country;
  distanceKm: number;
  isCorrect: boolean;
  createdAt?: Date;
  guessIndex?: number;
}): GuessRecord {
  const createdAt = params.createdAt ?? new Date();
  const guessIndex = params.guessIndex ?? 1;

  return {
    id: `${createdAt.toISOString()}-${params.country.code}-${guessIndex}`,
    guess: params.guess.trim(),
    normalizedGuess: normalizeCountryKey(params.guess),
    countryCode: params.country.code,
    countryName: params.country.name,
    distanceKm: params.distanceKm,
    isCorrect: params.isCorrect,
    createdAt: createdAt.toISOString(),
  };
}

export function resolveGuess(params: {
  guess: string;
  item: GameItem;
  guesses?: GuessRecord[];
}): GuessResolution {
  const normalizedGuess = normalizeCountryKey(params.guess);
  const match = resolveCountryMatch(params.guess);
  const resolvedCountry = match.country;
  const didYouMeanCountry = match.didYouMean?.country ?? null;
  const targetCountry = getCountryByCode(params.item.originCountryCode);

  if (!targetCountry) {
    throw new Error(
      `Missing country seed for item origin code: ${params.item.originCountryCode}`,
    );
  }

  const duplicate = isDuplicateGuess(
    params.guesses ?? [],
    normalizedGuess,
    resolvedCountry,
  );

  if (!resolvedCountry) {
    const neutral = getNeutralColorToken();

    return {
      normalizedGuess,
      resolvedCountry: null,
      didYouMeanCountry,
      isDuplicate: duplicate,
      isCorrect: false,
      distanceKm: null,
      heatColor: neutral.color,
      heatLevel: neutral.level,
      matchType: match.matchType,
    };
  }

  const distanceKm = haversineKm(resolvedCountry.centroid, targetCountry.centroid);
  const heat = getHeatColorForDistance(distanceKm);

  return {
    normalizedGuess,
    resolvedCountry,
    didYouMeanCountry,
    isDuplicate: duplicate,
    isCorrect: resolvedCountry.code === targetCountry.code,
    distanceKm,
    heatColor: heat.color,
    heatLevel: heat.level,
    matchType: match.matchType,
  };
}

export function sortGuessesByDistance(guesses: GuessRecord[]): GuessRecord[] {
  return [...guesses].sort((left, right) => {
    if (left.distanceKm === null && right.distanceKm === null) {
      return left.createdAt.localeCompare(right.createdAt);
    }

    if (left.distanceKm === null) {
      return 1;
    }

    if (right.distanceKm === null) {
      return -1;
    }

    if (left.distanceKm !== right.distanceKm) {
      return left.distanceKm - right.distanceKm;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function hasDuplicateGuess(
  guesses: GuessRecord[],
  guess: string,
): boolean {
  const normalizedGuess = normalizeCountryKey(guess);
  const resolvedCountry = resolveCountryMatch(guess).country;

  return isDuplicateGuess(guesses, normalizedGuess, resolvedCountry);
}
