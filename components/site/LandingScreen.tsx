"use client";

import LandingHeroReel from "./LandingHeroReel";
import AssistModeToggle from "./AssistModeToggle";
import HowToPlayCard from "./HowToPlayCard";
import OriginGuessrMark from "./OriginGuessrMark";
import ThemeToggleButton from "./ThemeToggleButton";
import type { GameSettings } from "@/lib/settings/game-settings.ts";

type LandingScreenProps = {
  onPlay: () => void;
  settings: GameSettings;
  onToggleAssistInput: () => void;
  onToggleLightMode: () => void;
};

export default function LandingScreen({
  onPlay,
  settings,
  onToggleAssistInput,
  onToggleLightMode,
}: LandingScreenProps) {
  return (
    <main id="top" className="min-h-screen overflow-x-clip px-5 py-8 sm:px-6 lg:px-8">
      <ThemeToggleButton
        enabled={settings.lightMode}
        onToggle={onToggleLightMode}
        className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6"
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-1 sm:pt-2">
        <header className="space-y-5 text-center pt-1 sm:pt-2">
          <OriginGuessrMark size="hero" />
          <div className="space-y-5 pt-1">
            <p className="text-base font-medium uppercase tracking-[0.38em] text-white/54 sm:text-sm">
              Guess the origin of everyday things.
            </p>
            <h1 className="mx-auto max-w-4xl font-display text-xl tracking-[-0.04em] text-white sm:text-2xl lg:text-[2rem]">
              Trace foods, inventions, and cultural icons back to their origin
              in as few guesses as possible.
            </h1>
          </div>
        </header>

      </div>

      <section className="w-full overflow-x-clip py-1 sm:py-2">
        <LandingHeroReel onPlay={onPlay} lightMode={settings.lightMode} />

        <div className="mx-auto w-full max-w-7xl px-5 pt-2 text-center sm:px-6 sm:pt-3 lg:px-8">
          <p className="text-base font-medium uppercase tracking-[0.34em] text-white/52 sm:text-lg">
            Click the globe to play
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 py-12 text-center sm:gap-10 sm:py-14">
        <AssistModeToggle
          enabled={settings.assistInput}
          onToggle={onToggleAssistInput}
          className="justify-center"
        />

        <section className="w-full max-w-4xl">
          <HowToPlayCard />
        </section>

        <footer className="grid w-full max-w-4xl gap-3 border-t border-white/8 pt-6 text-sm text-white/55 sm:grid-cols-3 sm:items-center">
          <p className="justify-self-center sm:text-center">Developed by Mril</p>

          <a
            href="#top"
            aria-label="Back to top"
            className="group justify-self-center rounded-full p-2 transition duration-200 hover:text-white hover:opacity-90 active:scale-95 sm:justify-self-center sm:p-3"
          >
            <span className="flex h-8 w-8 items-center justify-center sm:h-9 sm:w-9" aria-hidden="true">
              <UpArrowIcon className="h-5 w-5 transition duration-200 group-hover:-translate-y-0.5 sm:h-5.5 sm:w-5.5" />
            </span>
          </a>

          <p className="justify-self-center text-center sm:justify-self-end sm:text-right">
            This app is still in Beta
          </p>
        </footer>
      </div>
    </main>
  );
}

function UpArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 19V5" />
      <path d="M6.5 10.5L12 5l5.5 5.5" />
    </svg>
  );
}
