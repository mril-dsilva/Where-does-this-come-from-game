type ResultBannerProps = {
  tone: "neutral" | "positive" | "warning" | "error";
  title: string;
  detail: string;
  onReset?: () => void;
  resetLabel?: string;
};

const TONE_STYLES: Record<
  ResultBannerProps["tone"],
  { border: string; background: string; text: string }
> = {
  neutral: {
    border: "border-white/10",
    background: "bg-white/[0.04]",
    text: "text-white",
  },
  positive: {
    border: "border-emerald-400/20",
    background: "bg-emerald-400/10",
    text: "text-emerald-100",
  },
  warning: {
    border: "border-amber-300/20",
    background: "bg-amber-300/10",
    text: "text-amber-50",
  },
  error: {
    border: "border-rose-300/20",
    background: "bg-rose-300/10",
    text: "text-rose-50",
  },
};

export default function ResultBanner({
  tone,
  title,
  detail,
  onReset,
  resetLabel = "Play again",
}: ResultBannerProps) {
  const toneStyle = TONE_STYLES[tone];

  return (
    <section
      className="flex w-full max-w-3xl flex-col items-center gap-4 text-center"
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      <h2 className={`font-display text-xl tracking-[-0.03em] ${toneStyle.text}`}>
        {title}
      </h2>
      <p className="max-w-2xl text-sm leading-6 text-white/66">
        {detail}
      </p>

      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 items-center justify-center rounded-full border border-white/12 bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/88"
        >
          {resetLabel}
        </button>
      ) : null}
    </section>
  );
}
