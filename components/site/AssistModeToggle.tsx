"use client";

type AssistModeToggleProps = {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
};

export default function AssistModeToggle({
  enabled,
  onToggle,
  className,
}: AssistModeToggleProps) {
  return (
    <div
      className={`mx-auto flex w-full max-w-xl items-center justify-center gap-4 text-center ${className ?? ""}`.trim()}
    >
      <p className="text-[0.95rem] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]">
        Assist Mode
      </p>

      <button
        type="button"
        aria-pressed={enabled}
        aria-label={enabled ? "Disable assist mode" : "Enable assist mode"}
        onClick={onToggle}
        className={`relative inline-flex h-8 w-14 flex-none items-center rounded-full border transition duration-200 ${
          enabled
            ? "border-[var(--foreground)] bg-[var(--foreground)]"
            : "border-[var(--border)] bg-[var(--assist-toggle-off)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        }`.trim()}
      >
        <span
          className={`inline-block h-6 w-6 translate-x-1 rounded-full bg-[var(--background)] shadow-[0_6px_16px_var(--shadow)] transition duration-200 ${
            enabled ? "translate-x-7" : "translate-x-1"
          }`.trim()}
        />
      </button>
    </div>
  );
}
