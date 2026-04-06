import { CORRECT_COLOR, getHeatColorForDistance } from "@/lib/game/heat.ts";

type GlobeLegendProps = {
  className?: string;
};

const LEGEND_ITEMS = [
  {
    label: "Cold",
    description: "Farthest guesses",
    color: getHeatColorForDistance(12_000).color,
  },
  {
    label: "Warm",
    description: "Getting closer",
    color: getHeatColorForDistance(3_000).color,
  },
  {
    label: "Hot",
    description: "Very close",
    color: getHeatColorForDistance(250).color,
  },
  {
    label: "Correct",
    description: "Solved country",
    color: CORRECT_COLOR,
  },
] as const;

export default function GlobeLegend({ className }: GlobeLegendProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-3 text-xs text-[var(--muted)] ${className ?? ""}`.trim()}
    >
      <span className="font-medium uppercase tracking-[0.35em] text-[var(--muted)]">
        Globe key
      </span>
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span className="font-medium text-[var(--foreground)]">
            {item.label}
          </span>
          <span className="text-[var(--muted)]">({item.description})</span>
        </div>
      ))}
      <span className="text-[var(--muted)]">
        Unguessed countries stay on the base Earth texture.
      </span>
      <span className="text-[var(--muted)]">
        Drag to rotate, scroll to zoom.
      </span>
    </div>
  );
}
