import type { GuessRecord } from "@/types/game.ts";

type GuessHistoryProps = {
  title: string;
  guesses: GuessRecord[];
  isComplete: boolean;
  latestGuessId: string | null;
  heatForDistance: (distanceKm: number) => { level: string; color: string };
};

export default function GuessHistory({
  title,
  guesses,
  isComplete,
  latestGuessId,
  heatForDistance,
}: GuessHistoryProps) {
  return (
    <aside
      className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-sm"
      aria-label="Guess history"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-[var(--muted)]">
            Guess history
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            {title}
          </h2>
        </div>
        <span className="text-sm text-[var(--muted)]">
          {guesses.length} total
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {guesses.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-5 text-sm leading-6 text-[var(--muted)]">
            Your guesses will appear here, ordered from closest to farthest.
          </p>
        ) : (
          guesses.map((guess) => {
            const heat =
              guess.distanceKm === null
                ? { level: "neutral", color: "var(--border)" }
                : heatForDistance(guess.distanceKm);
            const isLatest = guess.id === latestGuessId;

            return (
              <div
                key={guess.id}
                className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition ${
                  isLatest
                    ? "border-[color:var(--foreground)] bg-white"
                    : "border-[color:var(--border)] bg-white/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: heat.color }}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      {guess.countryName ?? guess.guess}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {guess.isCorrect ? "Correct country" : heat.level}
                    </p>
                  </div>
                </div>

                <div className="text-right text-sm text-[var(--muted)]">
                  <p>{guess.distanceKm === null ? "No match" : `${guess.distanceKm.toLocaleString()} km`}</p>
                  <p>{guess.isCorrect ? "Solved" : isComplete ? "Locked" : "Pending"}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
