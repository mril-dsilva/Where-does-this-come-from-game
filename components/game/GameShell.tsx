"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getItems } from "@/lib/data/index.ts";
import { getCountrySuggestions } from "@/lib/data/country-match.ts";
import {
  createGameState,
  hasGuessBeenRecorded,
  submitGuess,
} from "@/lib/game/index.ts";
import type { GameItem, GameState } from "@/types/game.ts";
import HowToPlayCard from "@/components/site/HowToPlayCard";
import OriginGuessrMark from "@/components/site/OriginGuessrMark";
import ConfettiBurst from "./ConfettiBurst";
import GameClueStrip from "./GameClueStrip";
import WorldGlobe from "../globe/WorldGlobe";
import GuessHistory from "./GuessHistory";
import GuessInput from "./GuessInput";

type GameShellProps = {
  initialItem: GameItem;
  onExitLanding: () => void;
  onPlayAgain: () => void;
};

const CONFETTI_DURATION_MS = 1800;
const REEL_SIDE_COUNT = 20;
const REEL_TOTAL_COUNT = REEL_SIDE_COUNT * 2 + 1;

function createInitialState(item: GameItem): GameState {
  return createGameState(item);
}

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
  onExitLanding,
  onPlayAgain,
}: GameShellProps) {
  const [state, setState] = useState<GameState>(() =>
    createInitialState(initialItem),
  );
  const [inputValue, setInputValue] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiToken, setConfettiToken] = useState<string | null>(null);
  const [latestSubmittedCountryCode, setLatestSubmittedCountryCode] = useState<
    string | null
  >(null);
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
        color: guess.heatColor,
        altitude: guess.isCorrect
          ? 0.034
          : guess.countryCode === latestSubmittedCountryCode
            ? 0.022
            : 0.014,
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

    if (state.isComplete) {
      return;
    }

    if (hasGuessBeenRecorded(state.guesses, trimmedGuess)) {
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

  return (
    <main className="relative min-h-screen overflow-x-clip px-5 pt-4 pb-8 text-center sm:px-6 sm:pt-5 lg:px-8 lg:pt-6">
      <ConfettiBurst
        key={confettiToken ?? "idle"}
        active={showConfetti}
        triggerKey={confettiToken}
      />
      <div
        className={`mx-auto flex w-full flex-col items-stretch gap-0 transition-[margin-top] duration-[1150ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showGameplay ? "mt-0" : "mt-[calc(50svh-10rem)]"
        }`.trim()}
      >
        <div
          className={`relative mx-auto flex w-full max-w-4xl flex-col items-center gap-0 transition-[padding-top] duration-[1150ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            showGameplay ? "pt-0 sm:pt-1" : "pt-0"
          }`.trim()}
        >
          <OriginGuessrMark
            size="compact"
            onClick={onExitLanding}
            className="mt-0 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 shadow-[0_12px_40px_var(--shadow)] backdrop-blur-xl"
          />

          <h1 className="mt-1.5 font-sans text-[1.34rem] font-bold tracking-[-0.045em] text-white/96 sm:mt-2 sm:text-[1.72rem] lg:text-[2.25rem]">
            Guess the country of the day.
          </h1>
        </div>

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

      <div
        className={`mx-auto flex w-full max-w-4xl flex-col items-center gap-0 py-0 pt-[30px] transition-[opacity,transform] duration-[1150ms] ease-[cubic-bezier(0.16,1,0.3,1)] delay-[160ms] ${
          showGameplay
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0 pointer-events-none"
        }`.trim()}
      >
        <WorldGlobe
          highlights={globeHighlights}
          focusCountryCode={latestSubmittedCountryCode}
          framed={false}
          contentScale={1.47}
          className="mx-auto mt-0 mb-[14px] aspect-square h-[clamp(24.5rem,49vw,35.8rem)] w-[clamp(24.5rem,49vw,35.8rem)] max-w-none sm:mb-[20px]"
        />

        <GuessInput
          value={inputValue}
          disabled={isComplete}
          didYouMean={suggestionBundle.didYouMean}
          onChange={setInputValue}
          onSubmit={handleSubmit}
        />

        <GuessHistory
          guesses={guesses}
          latestGuessId={latestGuess?.id ?? null}
        />

        <HowToPlayCard
          collapsible
          answerLabel={activeItem.originCountryName}
          showLegend
        />
      </div>

      {isComplete && showSolvedPopup ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
          onClick={handleDismissSolvedPopup}
        >
          <div
            className="relative w-full max-w-[46rem] overflow-hidden rounded-[2.2rem] border border-white/12 bg-white/[0.08] px-7 py-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-10 sm:py-10"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex max-w-[37rem] flex-col items-center gap-5">
              <div className="flex h-[5.2rem] w-[5.2rem] items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-[2.55rem] shadow-[0_12px_40px_var(--shadow)]">
                <span aria-hidden="true">{solvedCountryFlag}</span>
              </div>

              <div className="space-y-2">
                <p className="font-display text-[1.48rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.86rem]">
                  The mystery country is {activeItem.originCountryName}!
                </p>
                <p className="text-[1.08rem] leading-7 text-white/78 sm:text-[1.15rem]">
                  {activeItem.fact}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={onPlayAgain}
                  className="inline-flex h-[3.15rem] items-center justify-center rounded-full bg-white px-6 text-[1.02rem] font-semibold text-black transition hover:scale-[1.02] hover:bg-white/95 active:scale-[0.98]"
                >
                  Play again
                </button>
                <button
                  type="button"
                  onClick={handleDismissSolvedPopup}
                  className="inline-flex h-[3.15rem] items-center justify-center rounded-full border border-white/14 bg-white/[0.04] px-6 text-[1.02rem] font-semibold text-white transition hover:border-white/24 hover:bg-white/[0.07]"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`mx-auto mt-[17px] flex w-full max-w-4xl flex-col items-center gap-0 py-0 transition-[opacity,transform] duration-[1150ms] ease-[cubic-bezier(0.16,1,0.3,1)] delay-[220ms] sm:mt-[21px] ${
          showGameplay
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none"
        }`.trim()}
      >
        <footer className="flex flex-col items-center gap-3 pt-2 text-center text-sm text-white/52">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-lg text-white/62 transition hover:border-white/20 hover:text-white"
            aria-label="Back to top"
          >
            ↑
          </button>
        </footer>
      </div>
    </main>
  );
}
