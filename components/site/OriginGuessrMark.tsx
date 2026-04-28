type OriginGuessrMarkProps = {
  size?: "hero" | "compact";
  onClick?: () => void;
  className?: string;
};

const SIZE_STYLES = {
  hero: "text-6xl tracking-[-0.06em] sm:text-8xl",
  compact: "text-xl tracking-[-0.05em] sm:text-2xl",
} as const;

export default function OriginGuessrMark({
  size = "hero",
  onClick,
  className,
}: OriginGuessrMarkProps) {
  const sharedClass = `items-center justify-center font-display font-semibold text-white transition ${SIZE_STYLES[size]} ${className ?? ""}`.trim();

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-fit cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${sharedClass}`}
      >
        OriginGuessr
      </button>
    );
  }

  return <div className={`inline-flex ${sharedClass}`}>OriginGuessr</div>;
}
