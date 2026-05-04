"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getItems } from "@/lib/data/index.ts";
import {
  getAssistCountryOptions,
  resolveCountryMatch,
} from "@/lib/data/country-match.ts";
import {
  createGameState,
  getDuplicateGuessFeedback,
  getRoundFeedback,
  hasGuessBeenRecorded,
  submitGuess,
} from "@/lib/game/index.ts";
import type {
  GameSettings,
  GuessInputAssistAttributes,
} from "@/lib/settings/game-settings.ts";
import { getGuessInputAssistAttributes } from "@/lib/settings/game-settings.ts";
import type { Country, GameItem, GameState } from "@/types/game.ts";
import AssistModeToggle from "@/components/site/AssistModeToggle";
import HowToPlayCard from "@/components/site/HowToPlayCard";
import OriginGuessrMark from "@/components/site/OriginGuessrMark";
import ThemeToggleButton from "@/components/site/ThemeToggleButton";
import ConfettiBurst from "./ConfettiBurst";
import GameClueStrip from "./GameClueStrip";
import RoundFeedback from "./RoundFeedback";
import SolvedPopup from "./SolvedPopup";
import WorldGlobe from "../globe/WorldGlobe";
import GuessHistory from "./GuessHistory";
import GuessInput from "./GuessInput";

type GameShellProps = {
  initialItem: GameItem;
  settings: GameSettings;
  onToggleAssistInput: () => void;
  onToggleLightMode: () => void;
  onExitLanding: () => void;
  onPlayAgain: () => void;
};

const CONFETTI_DURATION_MS = 3200;
const REEL_SIDE_COUNT = 20;
const REEL_TOTAL_COUNT = REEL_SIDE_COUNT * 2 + 1;

const GLOBE_ALTITUDE_CORRECT = 0.034;
const GLOBE_ALTITUDE_LATEST = 0.022;
const GLOBE_ALTITUDE_DEFAULT = 0.014;

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getFlagEmoji(countryCode: string | null): string {
  if (!countryCode || countryCode.length !== 2) {
    return "🏳️";
  }

  const code = countryCode.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(code)) {
    return "🏳️";
  }

  const baseCodePoint = 127397;

  return String.fromCodePoint(
    ...Array.from(code, (character) => baseCodePoint + character.charCodeAt(0)),
  );
}

export default function GameShell({
  initialItem,
  settings,
  onToggleAssistInput,
  onToggleLightMode,
  onExitLanding,
  onPlayAgain,
}: GameShellProps) {
  const [state, setState] = useState<GameState>(() =>
    createGameState(initialItem),
  );
  const [inputValue, setInputValue] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiToken, setConfettiToken] = useState<string | null>(null);
  const [latestSubmittedCountryCode, setLatestSubmittedCountryCode] = useState<
    string | null
  >(null);
  const [focusedCountryCode, setFocusedCountryCode] = useState<string | null>(
    null,
  );
  const [duplicateFeedbackCountry, setDuplicateFeedbackCountry] =
    useState<Country | null>(null);
  const [showGameplay, setShowGameplay] = useState(false);
  const [showSolvedPopup, setShowSolvedPopup] = useState(false);

  const guesses = state.guesses;
  const isComplete = state.isComplete;
  const activeItem = state.activeItem ?? initialItem;
  const confettiTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const latestGuess = useMemo(
    () =>
      [...guesses].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      )[0] ?? null,
    [guesses],
  );
  const assistSuggestions = useMemo(
    () =>
      settings.assistInput
        ? getAssistCountryOptions(inputValue, {
            excludeCodes: guesses
              .map((guess) => guess.countryCode)
              .filter((code): code is string => Boolean(code)),
          })
        : [],
    [guesses, inputValue, settings.assistInput],
  );
  const globeHighlights = useMemo(
    () =>
      guesses.map((guess) => ({
        countryCode: guess.countryCode ?? "",
        color: guess.heatColor,
        altitude: guess.isCorrect
          ? GLOBE_ALTITUDE_CORRECT
          : guess.countryCode === latestSubmittedCountryCode
            ? GLOBE_ALTITUDE_LATEST
            : GLOBE_ALTITUDE_DEFAULT,
        isLatest: guess.countryCode === latestSubmittedCountryCode,
      })),
    [guesses, latestSubmittedCountryCode],
  );
  const reelEmojis = useMemo(() => {
    const pool = getItems()
      .filter((item) => item.id !== activeItem.id)
      .map((item) => item.emoji)
      .sort((left, right) => left.localeCompare(right));

    if (pool.length === 0) {
      return Array.from({ length: REEL_TOTAL_COUNT }, () => "◌");
    }

    const offset = hashString(`${activeItem.id}-${state.createdAt}`) % pool.length;
    const rotated = Array.from(
      { length: REEL_SIDE_COUNT * 2 },
      (_, index) => pool[(offset + index) % pool.length] ?? "◌",
    );

    return [
      ...rotated.slice(0, REEL_SIDE_COUNT),
      activeItem.emoji,
      ...rotated.slice(REEL_SIDE_COUNT, REEL_SIDE_COUNT * 2),
    ];
  }, [activeItem.id, activeItem.emoji, state.createdAt]);
  const solvedCountryFlag = useMemo(
    () => getFlagEmoji(activeItem.originCountryCode),
    [activeItem.originCountryCode],
  );
  const guessInputAssistAttributes = useMemo<GuessInputAssistAttributes>(
    () => getGuessInputAssistAttributes(settings.assistInput),
    [settings.assistInput],
  );
  const roundFeedback = useMemo(
    () =>
      duplicateFeedbackCountry
        ? getDuplicateGuessFeedback(duplicateFeedbackCountry)
        : getRoundFeedback(guesses),
    [duplicateFeedbackCountry, guesses],
  );
  const globeFocusCountryCode =
    focusedCountryCode ?? latestSubmittedCountryCode;

  function handleInputChange(value: string) {
    setInputValue(value);
    setDuplicateFeedbackCountry(null);
  }

  useEffect(
    () => () => {
      if (confettiTimerRef.current) {
        window.clearTimeout(confettiTimerRef.current);
      }
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (showGameplay) {
      return undefined;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    const previousRootOverflow = documentElement.style.overflow;
    const previousRootOverscrollBehavior =
      documentElement.style.overscrollBehavior;

    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      documentElement.style.overflow = previousRootOverflow;
      documentElement.style.overscrollBehavior =
        previousRootOverscrollBehavior;
    };
  }, [showGameplay]);

  function handleClueRevealComplete() {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
    }

    revealTimerRef.current = window.setTimeout(() => {
      setShowGameplay(true);
    }, 1400);
  }

  function handleSubmit(guess: string) {
    const trimmedGuess = guess.trim();

    if (!trimmedGuess) {
      return;
    }

    setDuplicateFeedbackCountry(null);

    if (state.isComplete) {
      return;
    }

    if (hasGuessBeenRecorded(state.guesses, trimmedGuess)) {
      const resolvedCountry = resolveCountryMatch(trimmedGuess).country;

      if (resolvedCountry) {
        setDuplicateFeedbackCountry(resolvedCountry);
      }

      return;
    }

    const result = submitGuess({
      state,
      guess: trimmedGuess,
      now: new Date(),
    });

    if (!result.wasRecorded) {
      return;
    }

    setState(result.state);
    setInputValue("");
    setLatestSubmittedCountryCode(result.evaluation.resolvedCountry?.code ?? null);
    setFocusedCountryCode(result.evaluation.resolvedCountry?.code ?? null);

    if (result.evaluation.isCorrect) {
      if (confettiTimerRef.current) {
        window.clearTimeout(confettiTimerRef.current);
      }

      const token = result.state.completedAt ?? new Date().toISOString();
      setConfettiToken(token);
      setShowConfetti(true);
      setShowSolvedPopup(true);
      confettiTimerRef.current = window.setTimeout(() => {
        setShowConfetti(false);
      }, CONFETTI_DURATION_MS);
      return;
    }
  }

  function handleDismissSolvedPopup() {
    setShowSolvedPopup(false);
  }

  function handleFocusCountry(countryCode: string) {
    if (!countryCode) {
      return;
    }

    setFocusedCountryCode(countryCode);
  }

  return (
    <main className="relative min-h-screen overflow-x-clip px-5 pt-4 pb-8 text-center sm:px-6 sm:pt-5 lg:px-8 lg:pt-6">
      <ThemeToggleButton
        enabled={settings.lightMode}
        onToggle={onToggleLightMode}
        className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6"
      />

      <ConfettiBurst
        key={confettiToken ?? "idle"}
        active={showConfetti}
        triggerKey={confettiToken}
      />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 sm:gap-5">
        <div
          className={`mx-auto flex w-full flex-col items-stretch gap-0 transition-[margin-top] duration-[1150ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            showGameplay ? "mt-0" : "mt-[calc(50svh-10rem)]"
          }`.trim()}
        >
          <header
            className={`relative mx-auto flex w-full max-w-4xl flex-col items-center gap-0 text-center transition-[padding-top] duration-[1150ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              showGameplay ? "pt-0 sm:pt-1" : "pt-0"
            }`.trim()}
          >
            <OriginGuessrMark
              size="compact"
              onClick={onExitLanding}
              className="mt-0 w-fit rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 shadow-[0_12px_40px_var(--shadow)] backdrop-blur-xl sm:px-3 sm:py-1.5"
            />

            <h1 className="mt-1.5 font-sans text-[1.34rem] font-bold tracking-[-0.045em] text-white/96 sm:mt-2 sm:text-[1.72rem] lg:text-[2.25rem]">
              Guess the Origin Country of the Day.
            </h1>
          </header>

          <GameClueStrip
            key={`${activeItem.id}-${state.createdAt}`}
            emojis={reelEmojis}
            centerIndex={REEL_SIDE_COUNT}
            itemName={activeItem.name}
            animate
            onRevealComplete={handleClueRevealComplete}
            className="-mt-17 -mb-7 py-0 sm:-mt-19 sm:-mb-9"
          />
        </div>
      </div>

      <div
        className={`mx-auto flex w-full max-w-4xl flex-col items-center gap-0 py-0 pt-[30px] transition-[opacity,transform] duration-[1150ms] ease-[cubic-bezier(0.16,1,0.3,1)] delay-[160ms] ${
          showGameplay
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0 pointer-events-none"
        }`.trim()}
      >
        <RoundFeedback
          feedback={roundFeedback}
          onCountryClick={handleFocusCountry}
        />

        <WorldGlobe
          highlights={globeHighlights}
          focusCountryCode={globeFocusCountryCode}
          lightMode={settings.lightMode}
          framed={false}
          contentScale={1.47}
          className="mx-auto mt-0 mb-[14px] aspect-square h-[clamp(24.5rem,49vw,35.8rem)] w-[clamp(24.5rem,49vw,35.8rem)] max-w-none sm:mb-[20px]"
        />

        <GuessInput
          value={inputValue}
          disabled={isComplete}
          suggestions={assistSuggestions}
          assistAttributes={guessInputAssistAttributes}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
        />

        <GuessHistory
          guesses={guesses}
          latestGuessId={latestGuess?.id ?? null}
          onCountryClick={handleFocusCountry}
        />

        <AssistModeToggle
          enabled={settings.assistInput}
          onToggle={onToggleAssistInput}
          className="mb-4"
        />

        <HowToPlayCard
          collapsible
          answerLabel={activeItem.originCountryName}
          showLegend
        />
      </div>

      {isComplete && showSolvedPopup ? (
        <SolvedPopup
          lightMode={settings.lightMode}
          countryFlag={solvedCountryFlag}
          countryName={activeItem.originCountryName}
          guessCount={guesses.length}
          fact={activeItem.fact}
          onPlayAgain={onPlayAgain}
          onDismiss={handleDismissSolvedPopup}
        />
      ) : null}

    </main>
  );
}
