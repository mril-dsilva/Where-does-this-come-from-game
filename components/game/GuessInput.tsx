"use client";

import { useId, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { CountrySuggestion } from "@/lib/data/country-match.ts";

type GuessInputProps = {
  value: string;
  disabled?: boolean;
  suggestions: CountrySuggestion[];
  didYouMean: CountrySuggestion | null;
  onChange: (value: string) => void;
  onSubmit: (guess: string) => void;
  onSuggestionSelect: (value: string) => void;
};

export default function GuessInput({
  value,
  disabled = false,
  suggestions,
  didYouMean,
  onChange,
  onSubmit,
  onSuggestionSelect,
}: GuessInputProps) {
  const inputId = useId();
  const listId = useId();
  const helperId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const hasQuery = value.trim().length > 0;
  const canShowSuggestions = !disabled && hasQuery && suggestions.length > 0;
  const isOpen = isExpanded && canShowSuggestions;
  const activeSuggestionIndex =
    suggestions.length > 0
      ? Math.min(activeIndex, suggestions.length - 1)
      : -1;

  function closeSuggestions() {
    setIsExpanded(false);
    setActiveIndex(-1);
  }

  function selectSuggestion(suggestion: CountrySuggestion) {
    const selection = suggestion.country.name;
    onChange(selection);
    onSuggestionSelect(selection);
    closeSuggestions();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) {
      if (event.key === "Escape") {
        closeSuggestions();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) => {
        if (currentIndex < 0) return 0;
        return (currentIndex + 1) % suggestions.length;
      });
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) => {
        if (currentIndex < 0) return suggestions.length - 1;
        return (currentIndex - 1 + suggestions.length) % suggestions.length;
      });
    }

    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      const suggestion = suggestions[activeSuggestionIndex];

      if (suggestion) {
        selectSuggestion(suggestion);
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSuggestions();
    }
  }

  const activeSuggestionId =
    activeSuggestionIndex >= 0
      ? `${listId}-option-${activeSuggestionIndex}`
      : undefined;

  return (
    <form
      className="rounded-3xl border border-[color:var(--border)] bg-[var(--surface)] p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-[0.35em] text-[var(--muted)]"
          >
            Your guess
          </label>

          <div className="relative">
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
                setActiveIndex(-1);
                setIsExpanded(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (!disabled && hasQuery) {
                  setIsExpanded(true);
                }
              }}
              onBlur={() => {
                closeSuggestions();
              }}
              placeholder="Type a country name or code"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isOpen && suggestions.length > 0}
              aria-controls={listId}
              aria-activedescendant={activeSuggestionId}
              aria-describedby={helperId}
              className="w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[color:var(--foreground)] disabled:cursor-not-allowed disabled:bg-[color:var(--background)]"
            />

            <p
              id={helperId}
              className="mt-2 text-xs leading-5 text-[var(--muted)]"
            >
              Use arrow keys to move through suggestions, Enter to choose, or
              Escape to close.
            </p>

            {isOpen && suggestions.length > 0 ? (
              <div
                id={listId}
                role="listbox"
                className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[var(--surface)] shadow-lg"
              >
                {didYouMean ? (
                  <div className="border-b border-[color:var(--border)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                      Did you mean
                    </p>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectSuggestion(didYouMean)}
                      className="mt-1 text-left text-sm font-medium text-[var(--foreground)] underline decoration-[color:var(--border)] underline-offset-4"
                    >
                      {didYouMean.country.name}
                    </button>
                  </div>
                ) : null}

                <div className="max-h-72 overflow-auto p-2">
                  {suggestions.map((suggestion, index) => {
                    const isActive = index === activeSuggestionIndex;

                    return (
                      <button
                        key={`${suggestion.country.code}-${suggestion.matchedValue}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        id={`${listId}-option-${index}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectSuggestion(suggestion)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-left transition ${
                          isActive ? "bg-white" : "hover:bg-white/80"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-[var(--foreground)]">
                            {suggestion.country.name}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {suggestion.matchedValue} {suggestion.reason === "fuzzy" ? "• typo-tolerant" : ""}
                          </p>
                        </div>

                        <span className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                          {suggestion.country.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--foreground)] bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit guess
        </button>
      </div>
    </form>
  );
}
