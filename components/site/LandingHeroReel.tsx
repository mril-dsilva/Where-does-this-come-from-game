"use client";

import { useEffect, useRef, useState } from "react";
import { getItems } from "@/lib/data/index.ts";
import WorldGlobe from "@/components/globe/WorldGlobe";

type LandingHeroReelProps = {
  onPlay: () => void;
};

const SIDE_COUNT = 14;
const TOTAL_COUNT = SIDE_COUNT * 2 + 1;
const CENTER_INDEX = SIDE_COUNT;
const CENTER_CLEARANCE_PX = 115;
const BASE_ROTATE_SPEED = 0.6;
const MAX_ROTATE_SPEED = 12;
const HOVER_GROWTH_PER_SECOND = 3;
const RESTORE_DECAY_PER_SECOND = 0.28;
const HOVER_INTRO_SPEED = 1.4;

function getEmojiPool(): string[] {
  return getItems()
    .map((item) => item.emoji)
    .sort((left, right) => left.localeCompare(right));
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

const REEL_ITEMS = buildReelItems();

function buildReelItems(): string[] {
  const emojis = getEmojiPool();

  if (emojis.length === 0) {
    return Array.from({ length: TOTAL_COUNT }, () => "◌");
  }

  const offset = hashString("landing-hero") % emojis.length;

  return Array.from(
    { length: TOTAL_COUNT },
    (_, index) => emojis[(offset + index) % emojis.length] ?? "◌",
  );
}

export default function LandingHeroReel({ onPlay }: LandingHeroReelProps) {
  const [isGlobeHovered, setIsGlobeHovered] = useState(false);
  const [rotateSpeed, setRotateSpeed] = useState(BASE_ROTATE_SPEED);
  const rotateSpeedRef = useRef(BASE_ROTATE_SPEED);
  const leftItems = REEL_ITEMS.slice(0, CENTER_INDEX);
  const rightItems = REEL_ITEMS.slice(CENTER_INDEX + 1);

  useEffect(() => {
    let frame = 0;
    const startSpeed = rotateSpeedRef.current;
    const startTime = window.performance.now();

    const tick = (now: number) => {
      const elapsedSeconds = Math.max((now - startTime) / 1000, 0);
      const nextSpeed = isGlobeHovered
        ? Math.min(
            MAX_ROTATE_SPEED,
            startSpeed * Math.pow(HOVER_GROWTH_PER_SECOND, elapsedSeconds),
          )
        : Math.max(
            BASE_ROTATE_SPEED,
            startSpeed * Math.pow(RESTORE_DECAY_PER_SECOND, elapsedSeconds),
          );

      rotateSpeedRef.current = nextSpeed;
      setRotateSpeed(nextSpeed);

      if (
        (isGlobeHovered && nextSpeed < MAX_ROTATE_SPEED) ||
        (!isGlobeHovered && nextSpeed > BASE_ROTATE_SPEED)
      ) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isGlobeHovered]);

  return (
    <section className="w-full overflow-hidden py-4 sm:py-6" aria-label="Mystery clue reel">
      <div className="relative mx-auto h-[clamp(15rem,24vw,22rem)] w-full max-w-none">
        <div
          className="absolute inset-y-0 left-0 flex items-center justify-end gap-6 overflow-hidden pr-4 sm:gap-7 sm:pr-6 md:gap-8 md:pr-8 lg:gap-10 lg:pr-10"
          style={{ ...fadeMask, right: `calc(50% + ${CENTER_CLEARANCE_PX}px)` }}
          aria-hidden="true"
        >
          {leftItems.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex shrink-0 items-center justify-center text-2xl leading-none sm:text-3xl md:text-4xl lg:text-5xl"
              style={getEmojiStyle(leftItems.length - index)}
            >
              {item}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onPlay}
          onPointerEnter={() => {
            rotateSpeedRef.current = Math.max(
              rotateSpeedRef.current,
              BASE_ROTATE_SPEED * HOVER_INTRO_SPEED,
            );
            setRotateSpeed(rotateSpeedRef.current);
            setIsGlobeHovered(true);
          }}
          onPointerLeave={() => setIsGlobeHovered(false)}
          aria-label="Play OriginGuessr"
          className="group absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 outline-none transition hover:scale-[1.02] focus-visible:outline-none"
        >
          <WorldGlobe
            autoRotate
            autoRotateSpeed={rotateSpeed}
            enableZoom={false}
            showAtmosphere={false}
            atmosphereAltitude={0}
            framed={false}
            className="h-[15rem] w-[15rem] sm:h-[18rem] sm:w-[18rem] md:h-[20rem] md:w-[20rem] lg:h-[23rem] lg:w-[23rem]"
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/42 shadow-[0_12px_32px_var(--shadow)] backdrop-blur-xl transition duration-300 ease-out group-hover:scale-110 group-hover:bg-black/55 group-active:scale-95 sm:h-18 sm:w-18">
              <span className="ml-1 inline-block border-y-[10px] border-y-transparent border-l-[16px] border-l-white transition duration-300 ease-out group-hover:translate-x-0.5 sm:border-y-[12px] sm:border-l-[18px]" />
            </span>
          </span>
        </button>

        <div
          className="absolute inset-y-0 flex items-center justify-start gap-6 overflow-hidden pl-4 sm:gap-7 sm:pl-6 md:gap-8 md:pl-8 lg:gap-10 lg:pl-10"
          style={{
            ...fadeMask,
            left: `calc(50% + ${CENTER_CLEARANCE_PX}px)`,
            right: 0,
          }}
          aria-hidden="true"
        >
          {rightItems.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex shrink-0 items-center justify-center text-2xl leading-none sm:text-3xl md:text-4xl lg:text-5xl"
              style={getEmojiStyle(index + 1)}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const fadeMask = {
  WebkitMaskImage:
    "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
  maskImage:
    "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
};

function getEmojiStyle(distance: number) {
  const opacity = Math.max(0.18, 1 - distance * 0.12);
  const scale = Math.max(0.68, 1.08 - distance * 0.085);
  const blur = Math.min(10, distance * 1.3);

  return {
    opacity,
    filter: `blur(${blur}px)`,
    transform: `scale(${scale})`,
  };
}
