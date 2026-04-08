import { sortGuessesForDisplay } from "@/lib/game/index.ts";
import type { GuessRecord } from "@/types/game.ts";

type GuessHistoryProps = {
  guesses: GuessRecord[];
  latestGuessId: string | null;
};

export default function GuessHistory({
  guesses,
  latestGuessId,
}: GuessHistoryProps) {
  return (
    <aside className="w-full max-w-3xl text-center" aria-label="Guess history">
      <div className="mt-6 mb-[22px] rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_40px_var(--shadow)] backdrop-blur-2xl space-y-3 sm:mb-[30px]">
        {guesses.length === 0 ? (
          <p className="px-4 py-5 text-sm leading-6 text-white/54">
            Your guesses will appear here, ordered from closest to farthest.
          </p>
        ) : (
          sortGuessesForDisplay(guesses).map((guess, index) => {
            const isLatest = guess.id === latestGuessId;
            const isClosestGuess = index === 0;
            const statusLabel =
              guess.heatLevel === "correct"
                ? `The mystery country is ${guess.countryName ?? guess.guess}!`
                : guess.heatLevel === "neighboring"
                  ? "Neighboring!"
                  : `${(guess.distanceKm ?? 0).toLocaleString()} km away`;
            const statusParts =
              guess.heatLevel !== "correct" && isClosestGuess
                ? ["Closest Guess!", statusLabel]
                : [statusLabel];

            return (
              <div
                key={guess.id}
                className={`flex flex-col items-center gap-2 px-4 py-2.5 transition ${
                  isLatest ? "text-white" : "text-white/88"
                }`}
              >
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 whitespace-nowrap text-center text-[0.95rem] leading-none sm:text-base">
                  <span
                    className="text-[1.05em]"
                    aria-hidden="true"
                  >
                    {getFlagEmoji(guess.countryCode)}
                  </span>
                  <span className="font-medium text-white">
                    {guess.countryName ?? guess.guess}
                  </span>
                  {statusParts.map((part) => (
                    <span key={`${guess.id}-${part}`} className="inline-flex items-center gap-x-2">
                      <span className="text-white/44">-</span>
                      <span className="font-semibold text-white/76">
                        {part}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
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
