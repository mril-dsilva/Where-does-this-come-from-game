"use client";

import { getSolvedAttemptsLabel } from "@/lib/game/index.ts";

type SolvedPopupProps = {
  lightMode: boolean;
  countryFlag: string;
  countryName: string;
  guessCount: number;
  fact: string;
  onPlayAgain: () => void;
  onDismiss: () => void;
};

export default function SolvedPopup({
  lightMode,
  countryFlag,
  countryName,
  guessCount,
  fact,
  onPlayAgain,
  onDismiss,
}: SolvedPopupProps) {
  const backdropClass = lightMode
    ? "bg-black/15 backdrop-blur-[2px]"
    : "bg-black/35 backdrop-blur-sm";

  const panelClass = lightMode
    ? "border-[color:rgba(25,22,19,0.12)] bg-[rgba(250,246,240,0.97)] text-[var(--foreground)] shadow-[0_28px_95px_rgba(25,22,19,0.18)] backdrop-blur-xl"
    : "border-white/12 bg-white/[0.08] text-white shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl";

  const badgeClass = lightMode
    ? "border-[color:rgba(25,22,19,0.08)] bg-[rgba(255,255,255,0.82)] text-[var(--foreground)] shadow-[0_10px_30px_rgba(25,22,19,0.08)]"
    : "border-white/10 bg-white/[0.08] text-white shadow-[0_12px_40px_var(--shadow)]";

  const eyebrowClass = lightMode ? "text-[var(--muted)]" : "text-white/56";

  const bodyClass = lightMode
    ? "text-[color:rgba(25,22,19,0.78)]"
    : "text-white/78";

  const primaryButtonClass = lightMode
    ? "bg-[var(--foreground)] text-[var(--background)] shadow-[0_10px_30px_rgba(25,22,19,0.12)]"
    : "bg-white text-black";

  const secondaryButtonClass = lightMode
    ? "border-[color:rgba(25,22,19,0.12)] bg-[rgba(255,255,255,0.72)] text-[var(--foreground)] hover:border-[color:rgba(25,22,19,0.18)] hover:bg-[rgba(255,255,255,0.9)]"
    : "border-white/14 bg-white/[0.04] text-white hover:border-white/24 hover:bg-white/[0.07]";

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center p-4 ${backdropClass}`}
      onClick={onDismiss}
    >
      <div
        className={`relative w-full max-w-[46rem] overflow-hidden rounded-[2.2rem] border px-7 py-8 text-center sm:px-10 sm:py-10 ${panelClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex max-w-[37rem] flex-col items-center gap-5">
          {/* Flag badge */}
          <div
            className={`flex h-[5.2rem] w-[5.2rem] items-center justify-center rounded-full border text-[2.55rem] ${badgeClass}`}
          >
            <span aria-hidden="true">{countryFlag}</span>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <p className="font-display text-[1.48rem] font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-[1.86rem]">
              The mystery country is {countryName}!
            </p>
            <p
              className={`text-sm font-semibold uppercase tracking-[0.28em] ${eyebrowClass}`}
            >
              {getSolvedAttemptsLabel(guessCount)}
            </p>
            <p className={`text-[1.08rem] leading-7 sm:text-[1.15rem] ${bodyClass}`}>
              {fact}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={onPlayAgain}
              className={`inline-flex h-[3.15rem] cursor-pointer items-center justify-center rounded-full px-6 text-[1.02rem] font-semibold transition hover:scale-[1.02] active:scale-[0.98] ${primaryButtonClass}`}
            >
              Play again
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className={`inline-flex h-[3.15rem] cursor-pointer items-center justify-center rounded-full border px-6 text-[1.02rem] font-semibold transition ${secondaryButtonClass}`}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
