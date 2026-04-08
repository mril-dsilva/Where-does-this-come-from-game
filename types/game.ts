import type { GuessHeatLevel } from "@/lib/game/heat.ts";

export type GameCategory = "food" | "invention" | "brand";

export type GameItem = {
  id: string;
  name: string;
  emoji: string;
  category: GameCategory;
  originCountryCode: string;
  originCountryName: string;
  fact: string;
};

export type CountryCentroid = {
  latitude: number;
  longitude: number;
};

export type Country = {
  code: string;
  alpha3: string;
  name: string;
  aliases: string[];
  centroid: CountryCentroid;
};

export type GuessRecord = {
  id: string;
  guess: string;
  normalizedGuess: string;
  countryCode: string | null;
  countryName: string | null;
  distanceKm: number | null;
  heatLevel: GuessHeatLevel;
  heatColor: string;
  isCorrect: boolean;
  createdAt: string;
};

export type GameState = {
  activeItemId: string | null;
  activeItem: GameItem | null;
  guesses: GuessRecord[];
  isComplete: boolean;
  createdAt: string;
  completedAt: string | null;
};
