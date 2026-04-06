import type { GameItem } from "@/types/game.ts";

type ItemPromptCardProps = {
  item: GameItem;
  isComplete: boolean;
};

export default function ItemPromptCard({
  item,
  isComplete,
}: ItemPromptCardProps) {
  return (
    <section className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-[var(--muted)]">
            Current clue
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {item.name}
          </h2>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
            {item.category}
          </p>
        </div>

        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-white text-4xl">
          <span aria-hidden="true">{item.emoji}</span>
        </div>
      </div>

      <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--muted)]">
        {isComplete
          ? "You found the origin. The country panel stays locked for this round."
          : "Type the country you think this item originally comes from."}
      </p>
    </section>
  );
}
