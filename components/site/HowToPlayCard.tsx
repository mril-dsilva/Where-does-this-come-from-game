"use client";

import { useState } from "react";
import GlobeLegend from "@/components/globe/GlobeLegend";

type HowToPlayCardProps = {
  collapsible?: boolean;
  answerLabel?: string | null;
  showLegend?: boolean;
  className?: string;
};

const INSTRUCTIONS =
  "You’ll see a food, invention, artwork, game, or cultural item. Guess the country it originated from in as few tries as possible.";

export default function HowToPlayCard({
  collapsible = false,
  answerLabel = null,
  showLegend = true,
  className,
}: HowToPlayCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  const content = (
    <div className="flex flex-col items-center space-y-6 text-center">
      <p className="mx-auto max-w-3xl text-[0.92rem] leading-[1.75] text-white/74 sm:text-[1.05rem]">
        {INSTRUCTIONS}
      </p>

      {showLegend ? (
        <GlobeLegend className="rounded-2xl border border-white/8 bg-white/[0.03] px-6 py-5 sm:px-8 sm:py-6" />
      ) : null}

      <div className="space-y-2 text-[0.92rem] text-white/66 sm:text-[1.02rem]">
        <p>The warmer the country, the closer you are to the answer.</p>
        <p>New clues are added daily.</p>
      </div>

      {answerLabel ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowAnswer((current) => !current)}
            className="inline-flex h-11 items-center justify-center rounded-full px-5 text-[0.95rem] font-semibold text-white/76 underline decoration-white/20 underline-offset-4 transition hover:text-white"
          >
            Stuck? Reveal the answer
          </button>

          {showAnswer ? (
            <p className="text-[0.95rem] leading-6 text-white/84">
              Answer: <span className="font-medium text-white">{answerLabel}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (collapsible) {
    return (
      <details
        className={`mx-auto w-full max-w-3xl rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-7 shadow-[0_18px_60px_var(--shadow)] backdrop-blur-2xl sm:p-8 ${className ?? ""}`.trim()}
      >
        <summary className="cursor-pointer list-none text-center font-display text-[1.15rem] font-semibold uppercase tracking-[0.16em] text-white/96 sm:text-[1.45rem]">
          How to Play
        </summary>
        <div className="mt-6">{content}</div>
      </details>
    );
  }

  return (
    <section
      className={`mx-auto w-full max-w-3xl rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_18px_60px_var(--shadow)] backdrop-blur-2xl sm:p-10 ${className ?? ""}`.trim()}
    >
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="font-display text-[1.15rem] font-semibold uppercase tracking-[0.16em] text-white/96 sm:text-[1.45rem]">
            How to Play
          </h2>
        </div>
        {content}
      </div>
    </section>
  );
}
