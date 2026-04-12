"use client";

import CountryLink from "./CountryLink";
import type { RoundFeedback as RoundFeedbackValue } from "@/lib/game/feedback.ts";

type RoundFeedbackProps = {
  feedback: RoundFeedbackValue | null;
  onCountryClick: (countryCode: string) => void;
};

export default function RoundFeedback({
  feedback,
  onCountryClick,
}: RoundFeedbackProps) {
  if (!feedback) {
    return null;
  }

  if (feedback.kind === "duplicate") {
    return (
      <div
        className="mx-auto flex w-full max-w-3xl flex-col items-center gap-1 px-4 py-2 text-center text-[0.88rem] leading-6 text-white/68 sm:text-[0.98rem]"
        aria-live="polite"
      >
        <p className="font-medium text-white/86">
        <CountryLink
          label={feedback.country.name}
          onClick={() => onCountryClick(feedback.country.code)}
          className="font-medium tracking-[0.01em] text-[var(--foreground)]"
        />{" "}
          has already been guessed.
        </p>
      </div>
    );
  }

  const isNeighboring = feedback.isNeighboring;
  const relationshipTone = isNeighboring
    ? "text-[var(--feedback-neighbor)]"
    : feedback.relationship === "warmer"
      ? "text-[var(--feedback-warmer)]"
      : "text-[var(--feedback-cooler)]";
  const latestLabel = feedback.latestGuess.countryName ?? feedback.latestGuess.guess;

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-1 px-4 py-2 text-center text-[0.88rem] leading-6 text-white/68 sm:text-[0.98rem]"
      aria-live="polite"
    >
      <p className="font-medium text-white/86">
        <CountryLink
          label={latestLabel}
          onClick={() => onCountryClick(feedback.latestGuess.countryCode ?? "")}
          className="font-medium tracking-[0.01em] text-[var(--foreground)]"
        />{" "}
        is{" "}
        <strong className={`font-semibold ${relationshipTone}`}>
          {isNeighboring ? "neighboring" : feedback.relationship}
        </strong>
        !
      </p>
    </div>
  );
}
