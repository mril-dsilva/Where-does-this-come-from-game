"use client";

type ThemeToggleButtonProps = {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
};

export default function ThemeToggleButton({
  enabled,
  onToggle,
  className,
}: ThemeToggleButtonProps) {
  return (
    <button
      type="button"
      aria-label={enabled ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={enabled}
      onClick={onToggle}
      className={`inline-flex h-16 w-16 items-center justify-center rounded-full bg-transparent text-[var(--foreground)] transition duration-200 hover:opacity-70 active:scale-95 ${className ?? ""}`.trim()}
    >
      {enabled ? (
        <SunIcon className="h-7 w-7" />
      ) : (
        <MoonIcon className="h-7 w-7" />
      )}
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.3" />
      <path d="M12 19.2v2.3" />
      <path d="M4.8 4.8l1.6 1.6" />
      <path d="M17.6 17.6l1.6 1.6" />
      <path d="M2.5 12h2.3" />
      <path d="M19.2 12h2.3" />
      <path d="M4.8 19.2l1.6-1.6" />
      <path d="M17.6 6.4l1.6-1.6" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M18.6 14.1A7.4 7.4 0 1 1 9.9 5.4a6.1 6.1 0 1 0 8.7 8.7Z" />
    </svg>
  );
}
