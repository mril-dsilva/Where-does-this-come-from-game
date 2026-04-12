"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";

type ConfettiBurstProps = {
  active: boolean;
  triggerKey: string | null;
};

type ConfettiPiece = {
  id: string;
  left: string;
  delay: string;
  duration: string;
  drift: string;
  spin: string;
  size: string;
  scale: string;
  color: string;
  top: string;
};

const COLORS = ["#f3b48b", "#f0d38f", "#9ec2d9", "#9fc3ab", "#d9d1c7"];
const PIECE_COUNT = 34;

function createPieces(seed: string): ConfettiPiece[] {
  const base = seed.length || 1;

  return Array.from({ length: PIECE_COUNT }, (_, index) => {
    const direction = (index + base) % 2 === 0 ? 1 : -1;
    const spread = ((index % 8) - 3.5) * 10;

    return {
      id: `${seed}-${index}`,
      left: `${50 + spread}%`,
      top: `${-16 + (index % 5) * 3}%`,
      delay: `${(index % 7) * 55}ms`,
      duration: `${1900 + (index % 5) * 180}ms`,
      drift: `${direction * (40 + (index % 6) * 12)}px`,
      spin: `${direction * (260 + (index % 7) * 36)}deg`,
      size: `${7 + (index % 5)}px`,
      scale: `${0.92 + (index % 4) * 0.04}`,
      color: COLORS[index % COLORS.length],
    };
  });
}

export default function ConfettiBurst({
  active,
  triggerKey,
}: ConfettiBurstProps) {
  const pieces = useMemo(
    () => (active && triggerKey ? createPieces(triggerKey) : []),
    [active, triggerKey],
  );

  if (pieces.length === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece absolute rounded-sm"
          style={{
            left: piece.left,
            top: piece.top,
            width: piece.size,
            height: `calc(${piece.size} * 1.8)`,
            backgroundColor: piece.color,
            animationDuration: piece.duration,
            animationDelay: piece.delay,
            ["--drift"]: piece.drift,
            ["--spin"]: piece.spin,
            ["--confetti-scale"]: piece.scale,
          } as CSSProperties & {
            ["--drift"]: string;
            ["--spin"]: string;
            ["--confetti-scale"]: string;
          }}
        />
      ))}
    </div>
  );
}
