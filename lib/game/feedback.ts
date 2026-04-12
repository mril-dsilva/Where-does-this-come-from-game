import type { Country, GuessRecord } from "../../types/game.ts";
import { sortGuessesByDistance } from "./guess.ts";

export type RoundComparisonFeedback = {
  kind: "comparison";
  latestGuess: GuessRecord;
  closestGuess: GuessRecord;
  relationship: "warmer" | "cooler";
  isNeighboring: boolean;
};

export type DuplicateGuessFeedback = {
  kind: "duplicate";
  country: Country;
};

export type RoundFeedback = RoundComparisonFeedback | DuplicateGuessFeedback;

function getGuessLabel(guess: GuessRecord): string {
  return guess.countryName ?? guess.guess;
}

export function getRoundFeedback(
  guesses: GuessRecord[],
): RoundComparisonFeedback | null {
  if (guesses.length < 2) {
    return null;
  }

  const latestGuess =
    [...guesses].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    )[0] ?? null;

  if (!latestGuess) {
    return null;
  }

  const previousBestGuess = sortGuessesByDistance(
    guesses.filter((guess) => guess.id !== latestGuess.id),
  )[0];

  const closestGuess = sortGuessesByDistance(guesses)[0];

  if (!previousBestGuess || !closestGuess) {
    return null;
  }

  const latestDistance = latestGuess.distanceKm ?? Number.POSITIVE_INFINITY;
  const previousBestDistance =
    previousBestGuess.distanceKm ?? Number.POSITIVE_INFINITY;

  return {
    kind: "comparison",
    latestGuess,
    closestGuess,
    relationship:
      latestDistance < previousBestDistance ? "warmer" : "cooler",
    isNeighboring: latestGuess.heatLevel === "neighboring",
  };
}

export function getDuplicateGuessFeedback(country: Country): DuplicateGuessFeedback {
  return {
    kind: "duplicate",
    country,
  };
}

export function getSolvedAttemptsLabel(attemptCount: number): string {
  const normalizedAttempts = Math.max(0, Math.floor(attemptCount));

  return `Solved in ${normalizedAttempts} attempt${
    normalizedAttempts === 1 ? "" : "s"
  }`;
}

export function getGuessDisplayLabel(guess: GuessRecord): string {
  return getGuessLabel(guess);
}
