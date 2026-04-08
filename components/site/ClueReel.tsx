import EmojiReel from "./EmojiReel";

type ClueReelProps = {
  centerEmoji: string;
  sideEmojis: string[];
  animate?: boolean;
  label?: string;
  className?: string;
};

export default function ClueReel({
  centerEmoji,
  sideEmojis,
  animate = false,
  label,
  className,
}: ClueReelProps) {
  const reelEmojis = [
    sideEmojis[0] ?? "◌",
    sideEmojis[1] ?? "◌",
    sideEmojis[2] ?? "◌",
    sideEmojis[3] ?? "◌",
    centerEmoji,
    sideEmojis[4] ?? "◌",
    sideEmojis[5] ?? "◌",
    sideEmojis[6] ?? "◌",
    sideEmojis[7] ?? "◌",
  ];

  return (
    <section
      className={`space-y-4 text-center ${className ?? ""}`.trim()}
      aria-label={label}
    >
      <EmojiReel emojis={reelEmojis} centerIndex={4} animate={animate} />
    </section>
  );
}
