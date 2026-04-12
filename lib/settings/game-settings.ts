export type GameSettings = {
  assistInput: boolean;
  lightMode: boolean;
};

export type ThemeMode = "dark" | "light";

export type GuessInputAssistAttributes = {
  autoComplete: "on" | "off";
  autoCorrect: "on" | "off";
  autoCapitalize: "words" | "off";
  spellCheck: boolean;
};

export const GAME_SETTINGS_STORAGE_KEY = "originguessr.game-settings.v1";

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  assistInput: false,
  lightMode: false,
};

export function normalizeGameSettings(
  value: Partial<GameSettings> | null | undefined,
): GameSettings {
  return {
    assistInput: value?.assistInput === true,
    lightMode: value?.lightMode === true,
  };
}

export function readGameSettings(rawValue: string | null): GameSettings {
  if (!rawValue) {
    return DEFAULT_GAME_SETTINGS;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<GameSettings> | null;

    return normalizeGameSettings(parsed);
  } catch {
    return DEFAULT_GAME_SETTINGS;
  }
}

export function serializeGameSettings(settings: GameSettings): string {
  return JSON.stringify(normalizeGameSettings(settings));
}

export function resolveThemeMode(settings: GameSettings): ThemeMode {
  return settings.lightMode ? "light" : "dark";
}

export function getGuessInputAssistAttributes(
  enabled: boolean,
): GuessInputAssistAttributes {
  return {
    autoComplete: enabled ? "on" : "off",
    autoCorrect: enabled ? "on" : "off",
    autoCapitalize: enabled ? "words" : "off",
    spellCheck: enabled,
  };
}

export function buildThemeBootstrapScript(): string {
  const storageKey = JSON.stringify(GAME_SETTINGS_STORAGE_KEY);

  return `(() => {
    try {
      const raw = localStorage.getItem(${storageKey});
      const parsed = raw ? JSON.parse(raw) : null;
      const theme = parsed && parsed.lightMode ? "light" : "dark";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch {
      document.documentElement.dataset.theme = "dark";
      document.documentElement.style.colorScheme = "dark";
    }
  })();`;
}
