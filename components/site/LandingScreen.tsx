"use client";

import LandingHeroReel from "./LandingHeroReel";
import HowToPlayCard from "./HowToPlayCard";
import OriginGuessrMark from "./OriginGuessrMark";

type LandingScreenProps = {
  onPlay: () => void;
};

export default function LandingScreen({ onPlay }: LandingScreenProps) {
  return (
    <main id="top" className="min-h-screen overflow-x-clip px-5 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-10 py-4 text-center">
        <header className="space-y-5">
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
        <LandingHeroReel onPlay={onPlay} />

        <div className="mx-auto w-full max-w-7xl px-5 pt-2 text-center sm:px-6 sm:pt-3 lg:px-8">
          <p className="text-base font-medium uppercase tracking-[0.34em] text-white/52 sm:text-lg">
            Click the globe to play
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 py-12 text-center sm:gap-10 sm:py-14">
        <section className="w-full max-w-4xl">
          <HowToPlayCard />
        </section>

        <footer className="flex w-full max-w-4xl flex-col items-center gap-4 border-t border-white/8 pt-6 text-sm text-white/55 sm:flex-row sm:justify-between">
          <a href="#top" className="transition hover:text-white">
            Back to top
          </a>
          <p>Developed by MrillionAI</p>
        </footer>
      </div>
    </main>
  );
}
