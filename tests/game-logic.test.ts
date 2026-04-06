import assert from "node:assert/strict";
import test from "node:test";

import {
  CORRECT_COLOR,
  createGameState,
  getHeatColorForDistance,
  sortGuessesByDistance,
  submitGuess,
} from "../lib/game/index.ts";
import {
  getCountryByCode,
  getCountryByName,
  getItems,
} from "../lib/data/index.ts";
import {
  getCountrySuggestions,
  resolveCountryMatch,
} from "../lib/data/country-match.ts";
import { haversineKm } from "../lib/geo/haversine.ts";

test("country lookup resolves aliases and codes", () => {
  assert.equal(getCountryByCode("se")?.name, "Sweden");
  assert.equal(getCountryByName("United States of America")?.code, "US");
});

test("expanded country aliases resolve the requested MVP examples", () => {
  const cases = [
    ["UK", "GB"],
    ["United Kingdom", "GB"],
    ["Great Britain", "GB"],
    ["Britain", "GB"],
    ["India", "IN"],
    ["China", "CN"],
    ["USA", "US"],
    ["United States", "US"],
    ["South Korea", "KR"],
    ["North Korea", "KP"],
    ["UAE", "AE"],
    ["Russia", "RU"],
    ["Czechia", "CZ"],
    ["Czech Republic", "CZ"],
    ["Ivory Coast", "CI"],
    ["Côte d’Ivoire", "CI"],
  ] as const;

  for (const [input, expectedCode] of cases) {
    assert.equal(getCountryByName(input)?.code, expectedCode);
  }
});

test("autocomplete suggestions surface typo tolerant country matches", () => {
  const bundle = getCountrySuggestions("Unted Kingdom");

  assert.equal(bundle.didYouMean?.country.code, "GB");
  assert.equal(bundle.suggestions[0]?.country.code, "GB");
  assert.equal(resolveCountryMatch("Unted Kingdom").country?.code, "GB");
  assert.equal(getCountrySuggestions("IN").exactMatch?.country.code, "IN");
});

test("small misspellings can resolve without overriding unclear guesses", () => {
  assert.equal(resolveCountryMatch("Inda").country?.code, "IN");
  assert.equal(resolveCountryMatch("Xyzz").country, null);
});

test("submitGuess accepts a very close typo when the match is obvious", () => {
  const item = getItems().find((entry) => entry.id === "nokia");

  if (!item) {
    throw new Error("Expected Nokia seed item to exist.");
  }

  const result = submitGuess({
    state: createGameState(item),
    guess: "Finlnd",
    now: new Date("2026-04-06T14:00:00.000Z"),
  });

  assert.equal(result.wasRecorded, true);
  assert.equal(result.evaluation.matchType, "approximate");
  assert.equal(result.evaluation.resolvedCountry?.code, "FI");
});

test("haversine distance returns kilometers and remains stable", () => {
  const paris = { latitude: 48.8566, longitude: 2.3522 };
  const london = { latitude: 51.5074, longitude: -0.1278 };

  const distanceKm = haversineKm(paris, london);

  assert.ok(Math.abs(distanceKm - 344) <= 5);
  assert.equal(haversineKm(paris, paris), 0);
});

test("heat colors progress from cold to red hot and green on correct guesses", () => {
  assert.equal(getHeatColorForDistance(12_000).level, "cold");
  assert.equal(getHeatColorForDistance(2_400).level, "warm");
  assert.equal(getHeatColorForDistance(120).level, "redHot");
  assert.equal(getHeatColorForDistance(0).color, CORRECT_COLOR);
});

test("submitGuess sorts guesses by proximity and prevents duplicates", () => {
  const item = getItems().find((entry) => entry.id === "pizza");

  if (!item) {
    throw new Error("Expected pizza seed item to exist.");
  }

  const initialState = createGameState(item);
  const first = submitGuess({
    state: initialState,
    guess: "France",
    now: new Date("2026-04-06T12:00:00.000Z"),
  });
  const second = submitGuess({
    state: first.state,
    guess: "Germany",
    now: new Date("2026-04-06T12:01:00.000Z"),
  });
  const duplicate = submitGuess({
    state: second.state,
    guess: "French Republic",
    now: new Date("2026-04-06T12:02:00.000Z"),
  });

  assert.equal(first.wasRecorded, true);
  assert.equal(second.wasRecorded, true);
  assert.equal(duplicate.wasRecorded, false);
  assert.equal(duplicate.state.guesses.length, 2);
  assert.ok(
    (second.state.guesses[0].distanceKm ?? Number.POSITIVE_INFINITY) <=
      (second.state.guesses[1].distanceKm ?? Number.POSITIVE_INFINITY),
  );
  assert.deepEqual(
    second.state.guesses.map((entry) => entry.countryCode).sort(),
    ["DE", "FR"],
  );
});

test("submitGuess marks the game complete and keeps the correct country green", () => {
  const item = getItems().find((entry) => entry.id === "nokia");

  if (!item) {
    throw new Error("Expected Nokia seed item to exist.");
  }

  const result = submitGuess({
    state: createGameState(item),
    guess: "Finland",
    now: new Date("2026-04-06T13:00:00.000Z"),
  });

  assert.equal(result.wasRecorded, true);
  assert.equal(result.state.isComplete, true);
  assert.equal(result.state.completedAt, "2026-04-06T13:00:00.000Z");
  assert.equal(result.evaluation.isCorrect, true);
  assert.equal(result.evaluation.heatColor, CORRECT_COLOR);
});

test("sortGuessesByDistance keeps unknown guesses at the end", () => {
  const sorted = sortGuessesByDistance([
    {
      id: "1",
      guess: "France",
      normalizedGuess: "france",
      countryCode: "FR",
      countryName: "France",
      distanceKm: 1000,
      isCorrect: false,
      createdAt: "2026-04-06T10:00:00.000Z",
    },
    {
      id: "2",
      guess: "Unknown",
      normalizedGuess: "unknown",
      countryCode: null,
      countryName: null,
      distanceKm: null,
      isCorrect: false,
      createdAt: "2026-04-06T10:01:00.000Z",
    },
  ]);

  assert.equal(sorted[0].id, "1");
  assert.equal(sorted[1].id, "2");
});
