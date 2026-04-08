type EmojiReelProps = {
  emojis: string[];
  centerIndex?: number;
  animate?: boolean;
  className?: string;
};

export default function EmojiReel({
  emojis,
  centerIndex = Math.floor(emojis.length / 2),
  animate = false,
  className,
}: EmojiReelProps) {
  return (
    <div
      className={`flex items-center justify-center gap-2 sm:gap-3 ${className ?? ""}`.trim()}
      aria-hidden="true"
    >
      {emojis.map((emoji, index) => {
        const distance = Math.abs(index - centerIndex);
        const scale = Math.max(0.72, 1.08 - distance * 0.08);
        const blur = Math.min(6, distance * 1.6);
        const opacity = Math.max(0.28, 1 - distance * 0.12);

        return (
          <div
            key={`${emoji}-${index}`}
            className={`reel-slot flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl shadow-[0_18px_40px_var(--shadow)] backdrop-blur-xl sm:h-20 sm:w-20 sm:text-3xl ${
              animate ? "reel-settle" : ""
            }`}
            style={{
              transform: `scale(${scale})`,
              opacity,
              filter: `blur(${blur}px)`,
              animationDelay: `${index * 40}ms`,
            }}
          >
            <span
              className={distance === 0 ? "text-3xl sm:text-4xl" : ""}
              style={{
                transform: distance === 0 ? "translateY(-1px)" : undefined,
              }}
            >
              {emoji}
            </span>
          </div>
        );
      })}
    </div>
  );
}
