"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getItems } from "@/lib/data/index.ts";
import { getCountrySuggestions } from "@/lib/data/country-match.ts";
import {
  CORRECT_COLOR,
  createGameState,
  getHeatColorForDistance,
  hasGuessBeenRecorded,
  submitGuess,
} from "@/lib/game/index.ts";
import type { GameItem, GameState } from "@/types/game.ts";
import ConfettiBurst from "./ConfettiBurst";
import GlobeLegend from "../globe/GlobeLegend";
import WorldGlobe from "../globe/WorldGlobe";
import GuessHistory from "./GuessHistory";
import GuessInput from "./GuessInput";
import ItemPromptCard from "./ItemPromptCard";
import ResultBanner from "./ResultBanner";

type GameShellProps = {
  initialItem: GameItem;
};

function pickRandomItem(items: GameItem[]): GameItem {
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? items[0];
}

function createInitialState(item: GameItem): GameState {
  return createGameState(item);
}

export default function GameShell({ initialItem }: GameShellProps) {
  const [state, setState] = useState<GameState>(() =>
    createInitialState(initialItem),
  );
  const [inputValue, setInputValue] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiToken, setConfettiToken] = useState<string | null>(null);
  const [latestSubmittedCountryCode, setLatestSubmittedCountryCode] = useState<
    string | null
  >(null);
  const [feedback, setFeedback] = useState<string>(
    "Enter a country name or code to begin.",
  );
  const [feedbackTone, setFeedbackTone] = useState<
    "neutral" | "positive" | "warning" | "error"
  >("neutral");

  const guesses = state.guesses;
  const isComplete = state.isComplete;
  const activeItem = state.activeItem ?? initialItem;
  const confettiTimerRef = useRef<number | null>(null);
  const latestGuess = useMemo(
    () =>
      [...guesses].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      )[0] ?? null,
    [guesses],
  );
  const suggestionBundle = useMemo(
    () =>
      getCountrySuggestions(inputValue, {
        excludeCodes: guesses
          .map((guess) => guess.countryCode)
          .filter((code): code is string => Boolean(code)),
      }),
    [guesses, inputValue],
  );
  const globeHighlights = useMemo(
    () =>
      guesses.map((guess) => ({
        countryCode: guess.countryCode ?? "",
        color: guess.isCorrect
          ? CORRECT_COLOR
          : getHeatColorForDistance(guess.distanceKm ?? 0).color,
        altitude: guess.isCorrect
          ? 0.034
          : guess.countryCode === latestSubmittedCountryCode
            ? 0.022
            : 0.014,
        isLatest: guess.countryCode === latestSubmittedCountryCode,
      })),
    [guesses, latestSubmittedCountryCode],
  );

  useEffect(
    () => () => {
      if (confettiTimerRef.current) {
        window.clearTimeout(confettiTimerRef.current);
      }
    },
    [],
  );

  function handleSubmit(guess: string) {
    const trimmedGuess = guess.trim();

    if (!trimmedGuess) {
      setFeedback("Please enter a country name.");
      setFeedbackTone("warning");
      return;
    }

    if (state.isComplete) {
      setFeedback("This round is complete. Refresh the page to try another item.");
      setFeedbackTone("neutral");
      return;
    }

    if (hasGuessBeenRecorded(state.guesses, trimmedGuess)) {
      setFeedback("That guess was already used. Try a different country.");
      setFeedbackTone("warning");
      return;
    }

    const result = submitGuess({
      state,
      guess: trimmedGuess,
      now: new Date(),
    });

    if (!result.wasRecorded) {
      if (!result.evaluation.resolvedCountry) {
        if (result.evaluation.didYouMeanCountry) {
          setFeedback(
            `Did you mean ${result.evaluation.didYouMeanCountry.name}?`,
          );
          setFeedbackTone("warning");
        } else {
          setFeedback(
            "We could not match that to a country. Try a common country name or code.",
          );
          setFeedbackTone("error");
        }
      } else if (result.evaluation.isDuplicate) {
        setFeedback("That guess was already used. Try a different country.");
        setFeedbackTone("warning");
      }

      return;
    }

    setState(result.state);
    setInputValue("");
    setLatestSubmittedCountryCode(result.evaluation.resolvedCountry?.code ?? null);

    if (result.evaluation.matchType === "approximate") {
      setFeedback(
        `Close enough. We matched that to ${result.evaluation.resolvedCountry?.name}.`,
      );
      setFeedbackTone("neutral");
      return;
    }

    if (result.evaluation.isCorrect) {
      if (confettiTimerRef.current) {
        window.clearTimeout(confettiTimerRef.current);
      }

      const token = result.state.completedAt ?? new Date().toISOString();
      setConfettiToken(token);
      setShowConfetti(true);
      confettiTimerRef.current = window.setTimeout(() => {
        setShowConfetti(false);
      }, 1500);
      setFeedback(`Solved. ${activeItem.originCountryName} is the right answer.`);
      setFeedbackTone("positive");
      return;
    }

    const distanceText =
      result.evaluation.distanceKm !== null
        ? `${result.evaluation.distanceKm.toLocaleString()} km away`
        : "distance unavailable";

    setFeedback(
      `${result.evaluation.resolvedCountry?.name ?? trimmedGuess} is ${distanceText}.`,
    );
    setFeedbackTone("neutral");
  }

  function handleReset() {
    if (confettiTimerRef.current) {
      window.clearTimeout(confettiTimerRef.current);
      confettiTimerRef.current = null;
    }

    const nextItem = pickRandomItem(getItems());
    setState(createInitialState(nextItem));
    setInputValue("");
    setShowConfetti(false);
    setConfettiToken(null);
    setLatestSubmittedCountryCode(null);
    setFeedback("Enter a country name or code to begin.");
    setFeedbackTone("neutral");
  }

  const historyTitle = isComplete
    ? "Solved guesses"
    : "Guesses so far";

  return (
    <section className="relative grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <ConfettiBurst
        key={confettiToken ?? "idle"}
        active={showConfetti}
        triggerKey={confettiToken}
      />
      <div className="grid gap-6">
        <ResultBanner
          tone={feedbackTone}
          title={feedback}
          detail={
            isComplete
              ? `${activeItem.fact}`
              : "Past guesses stay sorted from closest to farthest."
          }
          onReset={isComplete ? handleReset : undefined}
          resetLabel="Play again"
        />

        <section className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <WorldGlobe highlights={globeHighlights} />
          <GlobeLegend className="mt-4" />
        </section>

        <ItemPromptCard item={activeItem} isComplete={isComplete} />

        <GuessInput
          value={inputValue}
          disabled={isComplete}
          suggestions={suggestionBundle.suggestions}
          didYouMean={suggestionBundle.didYouMean}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          onSuggestionSelect={handleSubmit}
        />
      </div>

      <GuessHistory
        title={historyTitle}
        guesses={guesses}
        isComplete={isComplete}
        latestGuessId={latestGuess?.id ?? null}
        heatForDistance={getHeatColorForDistance}
      />
    </section>
  );
}
