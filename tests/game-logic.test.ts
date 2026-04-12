import assert from "node:assert/strict";
import test from "node:test";

import {
  CORRECT_COLOR,
  HEAT_COLOR_PALETTE,
  createGameState,
  getBorderDistanceKm,
  getHeatColorForDistance,
  sortGuessesByDistance,
  sortGuessesForDisplay,
  submitGuess,
} from "../lib/game/index.ts";
import {
  getCountryByCode,
  getCountryByName,
  getItems,
} from "../lib/data/index.ts";
import {
  getAssistCountryOptions,
  getCountrySuggestions,
  resolveCountryMatch,
} from "../lib/data/country-match.ts";
import {
  getDuplicateGuessFeedback,
  getRoundFeedback,
  getSolvedAttemptsLabel,
} from "../lib/game/feedback.ts";
import { haversineKm } from "../lib/geo/haversine.ts";

test("country lookup resolves aliases and codes", () => {
  assert.equal(getCountryByCode("se")?.name, "Sweden");
  assert.equal(getCountryByCode("USA")?.name, "United States");
  assert.equal(getCountryByCode("FRA")?.name, "France");
  assert.equal(getCountryByCode("GBR")?.name, "United Kingdom");
  assert.equal(getCountryByCode("AD")?.name, "Andorra");
  assert.equal(getCountryByCode("PS")?.name, "Palestine");
  assert.equal(getCountryByCode("MV")?.name, "Maldives");
  assert.equal(getCountryByCode("EH")?.name, "Western Sahara");
  assert.equal(getCountryByCode("TO")?.name, "Tonga");
  assert.equal(getCountryByCode("TV")?.name, "Tuvalu");
  assert.equal(getCountryByCode("VA")?.name, "Vatican City");
  assert.equal(getCountryByCode("MC")?.name, "Monaco");
  assert.equal(getCountryByCode("SG")?.name, "Singapore");
  assert.equal(getCountryByName("United States of America")?.code, "US");
  assert.equal(getCountryByName("Andorra")?.code, "AD");
  assert.equal(getCountryByName("State of Palestine")?.code, "PS");
  assert.equal(getCountryByName("Maldives")?.code, "MV");
  assert.equal(getCountryByName("Western Sahara")?.code, "EH");
  assert.equal(getCountryByName("Tonga")?.code, "TO");
  assert.equal(getCountryByName("Tuvalu")?.code, "TV");
  assert.equal(getCountryByName("Vatican City")?.code, "VA");
  assert.equal(getCountryByName("Monaco")?.code, "MC");
  assert.equal(getCountryByName("Singapore")?.code, "SG");
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

test("assist suggestions stay alphabetical and exclude guessed countries", () => {
  const options = getAssistCountryOptions("a", {
    excludeCodes: ["US"],
  });

  assert.ok(options.length > 0);
  assert.equal(options.some((country) => country.code === "US"), false);
  assert.equal(options[0].name.startsWith("A"), true);
});

test("round feedback stays empty until there is a previous guess to compare", () => {
  const item = getItems().find((entry) => entry.id === "lego");

  if (!item) {
    throw new Error("Expected LEGO seed item to exist.");
  }

  const firstGuess = submitGuess({
    state: createGameState(item),
    guess: "France",
    now: new Date("2026-04-06T12:00:00.000Z"),
  });

  assert.equal(getRoundFeedback(firstGuess.state.guesses), null);
});

test("round feedback reports warmer or cooler and the closest guess", () => {
  const item = getItems().find((entry) => entry.id === "lego");

  if (!item) {
    throw new Error("Expected LEGO seed item to exist.");
  }

  const firstGuess = submitGuess({
    state: createGameState(item),
    guess: "Australia",
    now: new Date("2026-04-06T12:00:00.000Z"),
  });
  const warmerGuess = submitGuess({
    state: firstGuess.state,
    guess: "France",
    now: new Date("2026-04-06T12:01:00.000Z"),
  });
  const coolerGuess = submitGuess({
    state: createGameState(item),
    guess: "Germany",
    now: new Date("2026-04-06T12:02:00.000Z"),
  });

  const warmerFeedback = getRoundFeedback(warmerGuess.state.guesses);
  const coolerFeedback = getRoundFeedback(
    submitGuess({
      state: coolerGuess.state,
      guess: "France",
      now: new Date("2026-04-06T12:03:00.000Z"),
      }).state.guesses,
  );

  assert.equal(warmerFeedback?.kind, "comparison");
  assert.equal(warmerFeedback?.relationship, "warmer");
  assert.equal(warmerFeedback?.isNeighboring, false);
  assert.equal(warmerFeedback?.latestGuess.countryName, "France");
  assert.equal(warmerFeedback?.closestGuess.countryName, "France");

  assert.equal(coolerFeedback?.kind, "comparison");
  assert.equal(coolerFeedback?.relationship, "cooler");
  assert.equal(coolerFeedback?.isNeighboring, false);
  assert.equal(coolerFeedback?.latestGuess.countryName, "France");
  assert.equal(coolerFeedback?.closestGuess.countryName, "Germany");
});

test("duplicate guess feedback returns the country object", () => {
  const country = getCountryByCode("FR");

  if (!country) {
    throw new Error("Expected France country data to exist.");
  }

  const feedback = getDuplicateGuessFeedback(country);

  assert.equal(feedback.kind, "duplicate");
  assert.equal(feedback.country.code, "FR");
  assert.equal(feedback.country.name, "France");
});

test("solved attempts label uses singular and plural forms", () => {
  assert.equal(getSolvedAttemptsLabel(1), "Solved in 1 attempt");
  assert.equal(getSolvedAttemptsLabel(3), "Solved in 3 attempts");
});

test("small misspellings can resolve without overriding unclear guesses", () => {
  assert.equal(resolveCountryMatch("Inda").country?.code, "IN");
  assert.equal(resolveCountryMatch("Xyzz").country, null);
});

test("submitGuess accepts a very close typo when the match is obvious", () => {
  const item = getItems().find((entry) => entry.id === "ikea");

  if (!item) {
    throw new Error("Expected IKEA seed item to exist.");
  }

  const result = submitGuess({
    state: createGameState(item),
    guess: "Swedn",
    now: new Date("2026-04-06T14:00:00.000Z"),
  });

  assert.equal(result.wasRecorded, true);
  assert.equal(result.evaluation.matchType, "approximate");
  assert.equal(result.evaluation.resolvedCountry?.code, "SE");
});

test("haversine distance returns kilometers and remains stable", () => {
  const paris = { latitude: 48.8566, longitude: 2.3522 };
  const london = { latitude: 51.5074, longitude: -0.1278 };

  const distanceKm = haversineKm(paris, london);

  assert.ok(Math.abs(distanceKm - 344) <= 5);
  assert.equal(haversineKm(paris, paris), 0);
});

test("heat colors progress from far to hot and green on correct guesses", () => {
  assert.equal(getHeatColorForDistance(19_000).level, "far");
  assert.equal(getHeatColorForDistance(12_000).level, "far");
  assert.equal(getHeatColorForDistance(4_000).level, "faintWarm");
  assert.equal(getHeatColorForDistance(2_500).level, "mediumWarm");
  assert.equal(getHeatColorForDistance(1_500).level, "warm");
  assert.equal(getHeatColorForDistance(800).level, "strongWarm");
  assert.equal(getHeatColorForDistance(400).level, "hot");
  assert.equal(getHeatColorForDistance(0).color, CORRECT_COLOR);
});

test("border distance is based on country borders rather than centroids", () => {
  const franceSpain = getBorderDistanceKm("FR", "ES");
  const franceAustralia = getBorderDistanceKm("FR", "AU");
  const russiaIndia = getBorderDistanceKm("RU", "IN");

  assert.ok(franceSpain < franceAustralia);
  assert.ok(franceSpain >= 0);
  assert.ok(russiaIndia > 1_000);
});

test("neighboring countries always take the deepest red tier", () => {
  const item = getItems().find((entry) => entry.id === "lego");

  if (!item) {
    throw new Error("Expected LEGO seed item to exist.");
  }

  const result = submitGuess({
    state: createGameState(item),
    guess: "Germany",
    now: new Date("2026-04-06T12:15:00.000Z"),
  });

  assert.equal(result.wasRecorded, true);
  assert.equal(result.evaluation.heatLevel, "neighboring");
  assert.equal(result.evaluation.heatColor, HEAT_COLOR_PALETTE.neighboring);
});

test("submitGuess sorts guesses by proximity and prevents duplicates", () => {
  const item = getItems().find((entry) => entry.id === "lego");

  if (!item) {
    throw new Error("Expected LEGO seed item to exist.");
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
  const item = getItems().find((entry) => entry.id === "lego");

  if (!item) {
    throw new Error("Expected LEGO seed item to exist.");
  }

  const result = submitGuess({
    state: createGameState(item),
    guess: "Denmark",
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
      heatLevel: "warm",
      heatColor: HEAT_COLOR_PALETTE.warm,
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
      heatLevel: "neutral",
      heatColor: "#dad4c8",
      isCorrect: false,
      createdAt: "2026-04-06T10:01:00.000Z",
    },
  ]);

  assert.equal(sorted[0].id, "1");
  assert.equal(sorted[1].id, "2");
});

test("sortGuessesForDisplay keeps neighboring guesses above distance-only guesses", () => {
  const sorted = sortGuessesForDisplay([
    {
      id: "1",
      guess: "Sweden",
      normalizedGuess: "sweden",
      countryCode: "SE",
      countryName: "Sweden",
      distanceKm: 431,
      heatLevel: "neighboring",
      heatColor: HEAT_COLOR_PALETTE.neighboring,
      isCorrect: false,
      createdAt: "2026-04-06T10:00:00.000Z",
    },
    {
      id: "2",
      guess: "Spain",
      normalizedGuess: "spain",
      countryCode: "ES",
      countryName: "Spain",
      distanceKm: 1_800,
      heatLevel: "warm",
      heatColor: HEAT_COLOR_PALETTE.warm,
      isCorrect: false,
      createdAt: "2026-04-06T10:01:00.000Z",
    },
  ]);

  assert.equal(sorted[0].id, "1");
  assert.equal(sorted[1].id, "2");
});
