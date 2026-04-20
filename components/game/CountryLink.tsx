"use client";

type CountryLinkProps = {
  label: string;
  onClick: () => void;
  className?: string;
};

export default function CountryLink({
  label,
  onClick,
  className,
}: CountryLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center rounded-sm underline decoration-current decoration-[0.07em] underline-offset-[0.2em] transition-colors hover:text-white hover:decoration-current/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${className ?? ""}`.trim()}
    >
      {label}
    </button>
  );
}
