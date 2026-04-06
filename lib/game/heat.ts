export type GuessHeatLevel =
  | "neutral"
  | "cold"
  | "cool"
  | "warm"
  | "hot"
  | "redHot"
  | "correct";

export type HeatColorToken = {
  level: GuessHeatLevel;
  color: string;
};

export const COUNTRY_NEUTRAL_COLOR = "#dad4c8";
export const CORRECT_COLOR = "#2f9e57";

const DISTANCE_THRESHOLDS: Array<{
  maxKm: number;
  level: Exclude<GuessHeatLevel, "neutral" | "correct">;
  color: string;
}> = [
  { maxKm: 250, level: "redHot", color: "#dd3f32" },
  { maxKm: 900, level: "hot", color: "#ef7a2c" },
  { maxKm: 3000, level: "warm", color: "#f2b34e" },
  { maxKm: 7000, level: "cool", color: "#7fbbff" },
  { maxKm: 12000, level: "cold", color: "#d8ecff" },
];

export function getHeatColorForDistance(distanceKm: number): HeatColorToken {
  if (distanceKm <= 0) {
    return { level: "correct", color: CORRECT_COLOR };
  }

  const match = DISTANCE_THRESHOLDS.find((band) => distanceKm <= band.maxKm);

  if (match) {
    return { level: match.level, color: match.color };
  }

  return { level: "cold", color: DISTANCE_THRESHOLDS[DISTANCE_THRESHOLDS.length - 1].color };
}

export function getNeutralColorToken(): HeatColorToken {
  return { level: "neutral", color: COUNTRY_NEUTRAL_COLOR };
}
