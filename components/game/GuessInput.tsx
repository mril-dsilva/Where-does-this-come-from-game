"use client";

import { useId } from "react";
import type { FormEvent } from "react";
import type { Country } from "@/types/game.ts";
import type { GuessInputAssistAttributes } from "@/lib/settings/game-settings.ts";

type GuessInputProps = {
  value: string;
  disabled?: boolean;
  suggestions: Country[];
  assistAttributes: GuessInputAssistAttributes;
  onChange: (value: string) => void;
  onSubmit: (guess: string) => void;
};

export default function GuessInput({
  value,
  disabled = false,
  suggestions,
  assistAttributes,
  onChange,
  onSubmit,
}: GuessInputProps) {
  const inputId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
  }

  function getFlagEmoji(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) {
      return "🏳️";
    }

    const code = countryCode.trim().toUpperCase();

    if (!/^[A-Z]{2}$/.test(code)) {
      return "🏳️";
    }

    const baseCodePoint = 127397;

    return String.fromCodePoint(
      ...Array.from(code, (character) => baseCodePoint + character.charCodeAt(0)),
    );
  }

  return (
    <form
      className="mx-auto w-full max-w-3xl space-y-3 text-center"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-3 py-2.5 shadow-[0_14px_40px_var(--shadow)] backdrop-blur-2xl sm:px-4 sm:py-3">
          <input
            id={inputId}
            name="country-guess"
            type="text"
            autoComplete={assistAttributes.autoComplete}
            autoCorrect={assistAttributes.autoCorrect}
            autoCapitalize={assistAttributes.autoCapitalize}
            spellCheck={assistAttributes.spellCheck}
            value={value}
            disabled={disabled}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            placeholder="Enter a country name or code"
            className="w-full border-b border-[var(--border)] bg-transparent px-0 py-3 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] placeholder:opacity-100 focus:border-[var(--foreground)]/28 disabled:cursor-not-allowed disabled:opacity-50"
          />

          {suggestions.length > 0 ? (
            <div className="mt-3 overflow-hidden rounded-[1rem] border border-white/10 bg-white/[0.03] text-left">
              <div className="border-b border-white/8 px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/42">
                Suggestions
              </div>
              <div className="max-h-56 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.code}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onChange(suggestion.name)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-white/76 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">
                        {getFlagEmoji(suggestion.code)}
                      </span>
                      <span>{suggestion.name}</span>
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-white/34">
                      {suggestion.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="inline-flex h-[72px] cursor-pointer items-center justify-center rounded-2xl border border-white/12 bg-white px-5 text-sm font-semibold text-black transition hover:scale-[1.03] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 sm:self-start"
        >
          Submit guess
        </button>
      </div>
    </form>
  );
}
