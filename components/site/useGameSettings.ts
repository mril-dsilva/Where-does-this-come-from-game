"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_GAME_SETTINGS,
  GAME_SETTINGS_STORAGE_KEY,
  readGameSettings,
  resolveThemeMode,
  serializeGameSettings,
  type GameSettings,
} from "@/lib/settings/game-settings.ts";

export function useGameSettings() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

  useEffect(() => {
    try {
      setSettings(
        readGameSettings(window.localStorage.getItem(GAME_SETTINGS_STORAGE_KEY)),
      );
    } finally {
      setHasLoadedSettings(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSettings) {
      return;
    }

    const theme = resolveThemeMode(settings);

    try {
      window.localStorage.setItem(
        GAME_SETTINGS_STORAGE_KEY,
        serializeGameSettings(settings),
      );
    } catch {
      // Ignore storage failures and keep the session usable.
    }

    const { documentElement } = document;
    documentElement.dataset.theme = theme;
    documentElement.style.colorScheme = theme;
  }, [hasLoadedSettings, settings]);

  function setAssistInput(assistInput: boolean) {
    setSettings((current) => ({ ...current, assistInput }));
  }

  function toggleAssistInput() {
    setSettings((current) => ({
      ...current,
      assistInput: !current.assistInput,
    }));
  }

  function toggleLightMode() {
    setSettings((current) => ({
      ...current,
      lightMode: !current.lightMode,
    }));
  }

  return {
    settings,
    setAssistInput,
    toggleAssistInput,
    toggleLightMode,
  };
}
