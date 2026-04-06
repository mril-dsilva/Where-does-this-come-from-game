import { getCountryByCode } from "../data/index.ts";
import { normalizeCountryKey } from "../data/normalize.ts";
import type { GameItem, GameState, GuessRecord } from "../../types/game.ts";
import {
  createGuessRecord,
  resolveGuess,
  sortGuessesByDistance,
} from "./guess.ts";

export type SubmitGuessResult = {
  state: GameState;
  evaluation: ReturnType<typeof resolveGuess>;
  wasRecorded: boolean;
};

export function createGameState(item: GameItem): GameState {
  return {
    activeItemId: item.id,
    activeItem: item,
    guesses: [],
    isComplete: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

export function submitGuess(params: {
  state: GameState;
  guess: string;
  now?: Date;
}): SubmitGuessResult {
  if (!params.state.activeItem) {
    throw new Error("Cannot submit a guess without an active item.");
  }

  if (params.state.isComplete) {
    return {
      state: params.state,
      evaluation: resolveGuess({
        guess: params.guess,
        item: params.state.activeItem,
        guesses: params.state.guesses,
      }),
      wasRecorded: false,
    };
  }

  const evaluation = resolveGuess({
    guess: params.guess,
    item: params.state.activeItem,
    guesses: params.state.guesses,
  });

  if (evaluation.isDuplicate || !evaluation.resolvedCountry) {
    return {
      state: params.state,
      evaluation,
      wasRecorded: false,
    };
  }

  const targetCountry = getCountryByCode(params.state.activeItem.originCountryCode);

  if (!targetCountry) {
    throw new Error(
      `Missing country seed for item origin code: ${params.state.activeItem.originCountryCode}`,
    );
  }

  const distanceKm = evaluation.distanceKm ?? 0;
  const guessRecord = createGuessRecord({
    guess: params.guess,
    country: evaluation.resolvedCountry,
    distanceKm,
    isCorrect: evaluation.isCorrect,
    createdAt: params.now,
    guessIndex: params.state.guesses.length + 1,
  });

  const guesses = sortGuessesByDistance([
    ...params.state.guesses,
    guessRecord,
  ]);
  const isComplete = evaluation.isCorrect;

  return {
    state: {
      ...params.state,
      guesses,
      isComplete,
      completedAt: isComplete
        ? (params.now ?? new Date()).toISOString()
        : params.state.completedAt,
    },
    evaluation,
    wasRecorded: true,
  };
}

export function hasGuessBeenRecorded(
  guesses: GuessRecord[],
  guess: string,
): boolean {
  const normalizedGuess = normalizeCountryKey(guess);

  return guesses.some((entry) => entry.normalizedGuess === normalizedGuess);
}
