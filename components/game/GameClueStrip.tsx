"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

type GameClueStripProps = {
  emojis: string[];
  centerIndex?: number;
  itemName: string;
  animate?: boolean;
  onRevealComplete?: () => void;
  className?: string;
};

const REEL_START_OFFSET = 18;
const REEL_SCROLL_MS = 2400;
const NAME_REVEAL_DELAY_MS = 420;
const POST_LAND_REVEAL_MS = 280;

export default function GameClueStrip({
  emojis,
  centerIndex = Math.floor(emojis.length / 2),
  itemName,
  animate = false,
  onRevealComplete,
  className,
}: GameClueStripProps) {
  const startIndex = Math.max(0, centerIndex - REEL_START_OFFSET);
  const [focusIndex, setFocusIndex] = useState(
    animate ? startIndex : centerIndex,
  );
  const [isSettled, setIsSettled] = useState(!animate);
  const [blurActive, setBlurActive] = useState(!animate);
  const [showName, setShowName] = useState(!animate);
  const [centerEnlarged, setCenterEnlarged] = useState(!animate);
  const [centerSpread, setCenterSpread] = useState(!animate);
  const hasNotifiedReveal = useRef(false);

  useEffect(() => {
    if (!animate) {
      return undefined;
    }

    hasNotifiedReveal.current = false;
    let frame = 0;
    const startTime = window.performance.now();
    const revealTimer = window.setTimeout(() => {
      setBlurActive(true);
      setCenterSpread(true);
      setShowName(true);
      setCenterEnlarged(true);
    }, REEL_SCROLL_MS + NAME_REVEAL_DELAY_MS + POST_LAND_REVEAL_MS);

    const tick = (now: number) => {
      const elapsed = Math.min((now - startTime) / REEL_SCROLL_MS, 1);
      const eased = 1 - Math.pow(1 - elapsed, 7);
      const nextFocusIndex = startIndex + (centerIndex - startIndex) * eased;

      setFocusIndex(nextFocusIndex);

      if (elapsed < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        setIsSettled(true);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(revealTimer);
    };
  }, [animate, centerIndex, startIndex]);

  useEffect(() => {
    if (!onRevealComplete || !showName || !isSettled || hasNotifiedReveal.current) {
      return;
    }

    hasNotifiedReveal.current = true;
    onRevealComplete();
  }, [hasNotifiedReveal, isSettled, onRevealComplete, showName]);

  return (
    <section
      className={`relative left-1/2 w-[100dvw] -translate-x-1/2 max-w-none overflow-hidden py-1.5 sm:py-2.5 ${className ?? ""}`.trim()}
      aria-label="Clue reel"
    >
      <div className="relative mx-auto h-[clamp(12rem,18vw,16rem)] w-full max-w-none">
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            maskImage:
              "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          }}
          aria-hidden="true"
        >
          <div
            className="relative h-full w-full"
            style={
              {
                "--reel-step": "clamp(4.25rem, 7.5vw, 7rem)",
              } as CSSProperties
            }
          >
            {emojis.map((emoji, index) => {
              const distance = Math.abs(index - focusIndex);
              const opacity = Math.max(0.14, 1 - distance * 0.095);
              const scale = Math.max(
                0.5,
                isSettled && index === centerIndex
                  ? centerEnlarged
                    ? 2.42
                    : 1.02
                  : 1.14 - distance * 0.065,
              );
              const blur = blurActive ? Math.min(13, distance * 1.18) : 0;
              const isCenter = index === centerIndex;
              const spreadWeight = Math.max(0, 1 - distance / 3);
              const spreadDirection = index < centerIndex ? -1 : 1;
              const spreadOffset =
                centerSpread && !isCenter ? spreadDirection * spreadWeight * 32 : 0;

              return (
                <div
                  key={`${emoji}-${index}`}
                  className="absolute left-1/2 top-1/2 flex items-center justify-center text-xl leading-none sm:text-2xl md:text-3xl lg:text-4xl"
                  style={{
                    opacity,
                    filter: `blur(${blur}px)`,
                    transform: `translate3d(calc(-50% + ((var(--reel-step) * ${index}) - (var(--reel-step) * ${focusIndex})) + ${spreadOffset}px), -50%, 0) scale(${scale})`,
                    transition:
                      "transform 780ms cubic-bezier(0.16, 1, 0.3, 1), opacity 260ms linear, filter 420ms ease",
                  }}
                >
                  <span aria-hidden="true">{emoji}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p
        className={`mx-auto -mt-17 max-w-[16rem] text-center font-display text-[1.28rem] tracking-[-0.04em] text-white transition duration-500 sm:-mt-18 sm:text-[1.48rem] lg:text-[1.8rem] ${
          showName ? "translate-y-0 opacity-100" : "translate-y-0 opacity-0"
        }`}
      >
        {itemName}
      </p>
    </section>
  );
}
