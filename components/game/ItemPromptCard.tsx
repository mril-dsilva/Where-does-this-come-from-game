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
    <section className="w-full max-w-3xl space-y-4 text-center">
      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-white/46">
          Where did this come from?
        </p>
        <div className="text-6xl leading-none sm:text-7xl" aria-hidden="true">
          {item.emoji}
        </div>
        <h2 className="font-display text-3xl tracking-[-0.04em] text-white sm:text-4xl">
          {item.name}
        </h2>
        <p className="text-sm uppercase tracking-[0.3em] text-white/48">
          {item.category}
        </p>
      </div>

      <p className="mx-auto max-w-2xl text-sm leading-7 text-white/62">
        {isComplete
          ? "You found the origin. The country panel stays locked for this round."
          : "Type the country you think this item originally comes from."}
      </p>
    </section>
  );
}
