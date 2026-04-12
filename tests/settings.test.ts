import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_GAME_SETTINGS,
  GAME_SETTINGS_STORAGE_KEY,
  buildThemeBootstrapScript,
  getGuessInputAssistAttributes,
  normalizeGameSettings,
  readGameSettings,
  resolveThemeMode,
  serializeGameSettings,
} from "../lib/settings/game-settings.ts";

test("settings default values are safe and explicit", () => {
  assert.deepEqual(DEFAULT_GAME_SETTINGS, {
    assistInput: false,
    lightMode: false,
  });
  assert.deepEqual(normalizeGameSettings(undefined), DEFAULT_GAME_SETTINGS);
  assert.deepEqual(normalizeGameSettings(null), DEFAULT_GAME_SETTINGS);
});

test("settings persistence round-trips through storage serialization", () => {
  const settings = {
    assistInput: true,
    lightMode: true,
  };

  const serialized = serializeGameSettings(settings);

  assert.deepEqual(readGameSettings(serialized), settings);
  assert.deepEqual(readGameSettings("not-json"), DEFAULT_GAME_SETTINGS);
});

test("autofill and autocorrect setting maps to the expected input attributes", () => {
  assert.deepEqual(getGuessInputAssistAttributes(false), {
    autoComplete: "off",
    autoCorrect: "off",
    autoCapitalize: "off",
    spellCheck: false,
  });
  assert.deepEqual(getGuessInputAssistAttributes(true), {
    autoComplete: "on",
    autoCorrect: "on",
    autoCapitalize: "words",
    spellCheck: true,
  });
});

test("light mode setting resolves to the correct theme mode and bootstrap script", () => {
  assert.equal(resolveThemeMode({ assistInput: false, lightMode: false }), "dark");
  assert.equal(resolveThemeMode({ assistInput: true, lightMode: true }), "light");
  assert.match(buildThemeBootstrapScript(), new RegExp(GAME_SETTINGS_STORAGE_KEY));
});
