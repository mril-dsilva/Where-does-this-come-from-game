"use client";

import Link from "next/link";
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
          {/* OG Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] sm:h-20 sm:w-20">
              <span className="font-display text-2xl font-bold text-white sm:text-3xl">OG</span>
            </div>
            <div className="font-display text-sm font-semibold tracking-[0.1em] text-white/72 sm:text-base">
              ORIGINGUESSR
            </div>
          </div>

          <div className="space-y-5 pt-2">
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

        <footer className="flex w-full max-w-4xl flex-col gap-3 border-t border-white/8 pt-6 text-center text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="sm:text-left">Designed by Mril.</p>
          <Link
            href="/suggest"
            className="cursor-pointer font-medium text-white/48 underline decoration-white/20 underline-offset-4 transition hover:text-white/80 hover:decoration-white/40"
          >
            Suggest a clue →
          </Link>
          <p className="sm:text-right">This app is still in Beta.</p>
        </footer>
      </div>
    </main>
  );
}
