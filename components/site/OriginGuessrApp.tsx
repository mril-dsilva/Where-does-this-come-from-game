"use client";

import { useMemo, useState } from "react";
import { getItems } from "@/lib/data/index.ts";
import type { GameItem } from "@/types/game.ts";
import GameShell from "@/components/game/GameShell";
import LandingScreen from "./LandingScreen";

type ScreenMode = "landing" | "game";

function pickRandomItem(items: GameItem[]): GameItem {
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? items[0];
}

export default function OriginGuessrApp() {
  const items = useMemo(() => getItems(), []);
  const [mode, setMode] = useState<ScreenMode>("landing");
  const [activeItem, setActiveItem] = useState<GameItem | null>(null);
  const [sessionId, setSessionId] = useState(0);

  function startGame() {
    setActiveItem(pickRandomItem(items));
    setSessionId((current) => current + 1);
    setMode("game");
  }

  function restartGame() {
    setActiveItem(pickRandomItem(items));
    setSessionId((current) => current + 1);
    setMode("game");
  }

  function returnToLanding() {
    setMode("landing");
  }

  if (mode === "game" && activeItem) {
    return (
      <GameShell
        key={sessionId}
        initialItem={activeItem}
        onExitLanding={returnToLanding}
        onPlayAgain={restartGame}
      />
    );
  }

  return <LandingScreen onPlay={startGame} />;
}
