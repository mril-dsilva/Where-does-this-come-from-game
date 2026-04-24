"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggleButton from "@/components/site/ThemeToggleButton";
import { useGameSettings } from "@/components/site/useGameSettings";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const CATEGORIES = ["Food", "Invention", "Brand", "Cultural Icon"] as const;
type Category = (typeof CATEGORIES)[number];

const CONFIDENCE_OPTIONS = [
  { label: "Very sure", value: "very_sure" },
  { label: "Pretty sure", value: "pretty_sure" },
  { label: "Just a hunch", value: "hunch" },
] as const;
type Confidence = (typeof CONFIDENCE_OPTIONS)[number]["value"];

type FormStatus = "idle" | "submitting" | "success" | "error";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SuggestPage() {
  const { settings, toggleLightMode } = useGameSettings();

  const [status, setStatus] = useState<FormStatus>("idle");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [country, setCountry] = useState("");
  const [funFact, setFunFact] = useState("");
  const [confidence, setConfidence] = useState<Confidence | "">("");

  const isValid =
    itemName.trim().length > 0 && category !== "" && country.trim().length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || status === "submitting") return;

    setStatus("submitting");

    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: itemName.trim(),
          category,
          country: country.trim(),
          fun_fact: funFact.trim(),
          confidence,
        }),
      });

      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  function handleReset() {
    setItemName("");
    setCategory("");
    setCountry("");
    setFunFact("");
    setConfidence("");
    setStatus("idle");
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-6 lg:px-8">
      <ThemeToggleButton
        enabled={settings.lightMode}
        onToggle={toggleLightMode}
        className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6"
      />

      <div className="mx-auto w-full max-w-xl pb-20 pt-6 sm:pt-10">
        {/* Back link */}
        <Link
          href="/"
          className="mb-10 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-white/50 transition hover:text-white/90"
        >
          ← Back to game
        </Link>

        {/* Header */}
        <header className="mb-10 space-y-3">
          <p className="text-4xl" aria-hidden="true">
            🌍
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
            Suggest a Clue
          </h1>
          <p className="pt-1 text-[0.95rem] leading-relaxed text-white/58">
            Know something fascinating that traces back to a specific country?
            Share it — the best suggestions get added to the game.
          </p>
        </header>

        {/* Form or success state */}
        {status === "success" ? (
          <SuccessState onReset={handleReset} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-7" noValidate>
            {/* Item name */}
            <Field label="What is it?">
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Pizza, Bluetooth, LEGO"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/28 outline-none transition focus:border-white/26 focus:bg-white/[0.07]"
              />
            </Field>

            {/* Category */}
            <Field label="Category">
              <PillGroup>
                {CATEGORIES.map((cat) => (
                  <PillButton
                    key={cat}
                    active={category === cat}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </PillButton>
                ))}
              </PillGroup>
            </Field>

            {/* Country */}
            <Field label="Country of origin">
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Italy, Denmark, Japan"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/28 outline-none transition focus:border-white/26 focus:bg-white/[0.07]"
              />
            </Field>

            {/* Fun fact */}
            <Field
              label="Fun fact"
              hint="optional — but it helps a lot"
            >
              <textarea
                value={funFact}
                onChange={(e) => setFunFact(e.target.value)}
                placeholder="e.g. Pizza originated in Naples in the 18th century and was brought to the US by Italian immigrants."
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/28 outline-none transition focus:border-white/26 focus:bg-white/[0.07]"
              />
            </Field>

            {/* Confidence */}
            <Field label="How sure are you?" hint="optional">
              <PillGroup>
                {CONFIDENCE_OPTIONS.map((opt) => (
                  <PillButton
                    key={opt.value}
                    active={confidence === opt.value}
                    onClick={() => setConfidence(opt.value)}
                  >
                    {opt.label}
                  </PillButton>
                ))}
              </PillGroup>
            </Field>

            {/* Error message */}
            {status === "error" && (
              <p className="text-sm text-red-400">
                Something went wrong — please try again, or email us directly.
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || status === "submitting"}
              className="w-full cursor-pointer rounded-2xl bg-white py-4 text-sm font-semibold text-black transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              {status === "submitting" ? "Sending…" : "Submit suggestion →"}
            </button>
          </form>
        )}

        {/* Footer note */}
        {status !== "success" && (
          <p className="mt-8 text-center text-xs text-white/30">
            Suggestions are reviewed manually before being added to the game.
          </p>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Success state
// ---------------------------------------------------------------------------

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div className="space-y-5 py-8 text-center">
      <p className="text-5xl" aria-hidden="true">
        🎉
      </p>
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-white">
          Thanks for the suggestion!
        </h2>
        <p className="text-[0.95rem] leading-relaxed text-white/58">
          We&apos;ll take a look. If it makes the cut, you&apos;ll see it in a
          future update.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 pt-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border border-white/14 bg-white/[0.04] px-6 text-sm font-semibold text-white transition hover:scale-[1.02] active:scale-[0.98]"
        >
          Suggest another
        </button>
        <Link
          href="/"
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:scale-[1.02] active:scale-[0.98]"
        >
          Back to game
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-baseline gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.14em] text-white/72">
          {label}
        </span>
        {hint && (
          <span className="text-xs font-normal normal-case tracking-normal text-white/34">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function PillGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition hover:scale-[1.03] active:scale-[0.97] ${
        active
          ? "border-white/55 bg-white/10 text-white"
          : "border-white/14 bg-transparent text-white/48 hover:border-white/30 hover:text-white/80"
      }`}
    >
      {children}
    </button>
  );
}
