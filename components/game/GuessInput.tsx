"use client";

import { useId } from "react";
import type { FormEvent } from "react";
import type { CountrySuggestion } from "@/lib/data/country-match.ts";

type GuessInputProps = {
  value: string;
  disabled?: boolean;
  didYouMean: CountrySuggestion | null;
  onChange: (value: string) => void;
  onSubmit: (guess: string) => void;
};

export default function GuessInput({
  value,
  disabled = false,
  didYouMean,
  onChange,
  onSubmit,
}: GuessInputProps) {
  const inputId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
  }

  return (
    <form className="mx-auto w-full max-w-3xl space-y-3 text-center" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-3 py-2.5 shadow-[0_14px_40px_var(--shadow)] backdrop-blur-2xl sm:px-4 sm:py-3">
          <input
            id={inputId}
            name="country-guess"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={value}
            disabled={disabled}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            placeholder="Enter a country name or code"
            className="w-full border-b border-white/16 bg-transparent px-0 py-3 text-base text-white outline-none transition placeholder:text-white/34 focus:border-white/32 disabled:cursor-not-allowed disabled:opacity-50"
          />

          {didYouMean ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onChange(didYouMean.country.name)}
              className="mt-3 text-left text-sm text-white/70 underline decoration-white/18 underline-offset-4 transition hover:text-white"
            >
              Suggestion: {didYouMean.country.name}
            </button>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="inline-flex h-[72px] items-center justify-center rounded-2xl border border-white/12 bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Submit guess
        </button>
      </div>
    </form>
  );
}
