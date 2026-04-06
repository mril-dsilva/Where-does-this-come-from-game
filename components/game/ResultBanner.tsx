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
    border: "border-[color:var(--border)]",
    background: "bg-white",
    text: "text-[var(--muted)]",
  },
  positive: {
    border: "border-[#b4d8bd]",
    background: "bg-[#f2faf4]",
    text: "text-[#225f36]",
  },
  warning: {
    border: "border-[#e8d7aa]",
    background: "bg-[#fbf7ea]",
    text: "text-[#6f5712]",
  },
  error: {
    border: "border-[#e2b9b5]",
    background: "bg-[#fbf2f1]",
    text: "text-[#7c2f2f]",
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
      className={`rounded-3xl border p-6 shadow-sm ${toneStyle.border} ${toneStyle.background}`}
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-[var(--muted)]">
            Status
          </p>
          <h2 className={`text-xl font-semibold ${toneStyle.text}`}>{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {detail}
          </p>
        </div>

        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--foreground)] bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
          >
            {resetLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
