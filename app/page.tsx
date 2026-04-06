import GameShell from "@/components/game/GameShell";
import { getItems } from "@/lib/data/index.ts";

function pickRandomItem() {
  const items = getItems();
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? items[0];
}

export default function HomePage() {
  const initialItem = pickRandomItem();

  return (
    <main className="min-h-screen px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="max-w-3xl space-y-4 pt-2">
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-[var(--muted)]">
            Mrillion portfolio game
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
            Where does this come from?
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            Guess the country of origin from a single item and emoji hint.
            Rotate the globe, type a country, and use the heat colors to narrow
            in on the answer.
          </p>
        </header>

        <GameShell initialItem={initialItem} />
      </div>
    </main>
  );
}
