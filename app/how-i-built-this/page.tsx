import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggleButton from "@/components/site/ThemeToggleButton";
import { useGameSettings } from "@/components/site/useGameSettings";

export const metadata: Metadata = {
  title: "How I Built This — OriginGuessr by Mril",
  description: "Learn about the technical architecture and design decisions behind OriginGuessr.",
};

export default function HowIBuiltThisPage() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-6 lg:px-8">
      <ThemeToggleButton
        enabled={false}
        onToggle={() => {}}
        className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6"
      />

      <div className="mx-auto w-full max-w-3xl pb-20 pt-6 sm:pt-10">
        {/* Back link */}
        <Link
          href="/"
          className="mb-10 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-white/50 transition hover:text-white/90"
        >
          ← Back to game
        </Link>

        {/* Header */}
        <header className="mb-12 space-y-4">
          <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            How I Built This
          </h1>
          <p className="text-lg leading-relaxed text-white/68">
            Coming soon. Details about the technical architecture, design decisions, and tools used to build OriginGuessr.
          </p>
        </header>

        {/* Placeholder content */}
        <div className="space-y-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
          <div className="space-y-4">
            <div className="h-4 w-3/4 rounded bg-white/10" />
            <div className="h-4 w-full rounded bg-white/10" />
            <div className="h-4 w-5/6 rounded bg-white/10" />
          </div>
        </div>
      </div>
    </main>
  );
}
