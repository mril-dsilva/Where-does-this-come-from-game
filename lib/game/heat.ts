export type GuessHeatLevel =
  | "neutral"
  | "far"
  | "slightlyWarm"
  | "warm"
  | "hot"
  | "neighboring"
  | "correct";

export type HeatColorToken = {
  level: GuessHeatLevel;
  color: string;
};

export const COUNTRY_NEUTRAL_COLOR = "#dad4c8";
export const CORRECT_COLOR = "#2f9e57";
export const HEAT_COLOR_PALETTE = {
  neighboring: "#8f1f18",
  hot: "#c93f32",
  warm: "#e56d5d",
  slightlyWarm: "#f0ad9f",
  far: "#f8eae6",
} as const;

const HEAT_DECAY_KM = 2_200;
const HOT_THRESHOLD = 0.7;
const WARM_THRESHOLD = 0.38;
const SLIGHTLY_WARM_THRESHOLD = 0.16;

export function getHeatColorForDistance(distanceKm: number): HeatColorToken {
  if (distanceKm <= 0) {
    return { level: "correct", color: CORRECT_COLOR };
  }

  if (!Number.isFinite(distanceKm)) {
    return {
      level: "far",
      color: HEAT_COLOR_PALETTE.far,
    };
  }

  const score = Math.exp(-distanceKm / HEAT_DECAY_KM);

  if (score >= HOT_THRESHOLD) {
    return {
      level: "hot",
      color: blendHexColors(
        HEAT_COLOR_PALETTE.hot,
        HEAT_COLOR_PALETTE.warm,
        clamp01((1 - score) / (1 - HOT_THRESHOLD)),
      ),
    };
  }

  if (score >= WARM_THRESHOLD) {
    return {
      level: "warm",
      color: blendHexColors(
        HEAT_COLOR_PALETTE.warm,
        HEAT_COLOR_PALETTE.slightlyWarm,
        clamp01(
          (WARM_THRESHOLD - score) / (WARM_THRESHOLD - SLIGHTLY_WARM_THRESHOLD),
        ),
      ),
    };
  }

  if (score >= SLIGHTLY_WARM_THRESHOLD) {
    return {
      level: "slightlyWarm",
      color: blendHexColors(
        HEAT_COLOR_PALETTE.slightlyWarm,
        HEAT_COLOR_PALETTE.far,
        clamp01(
          (SLIGHTLY_WARM_THRESHOLD - score) / SLIGHTLY_WARM_THRESHOLD,
        ),
      ),
    };
  }

  return {
    level: "far",
    color: HEAT_COLOR_PALETTE.far,
  };
}

export function getHeatColorForGuess(params: {
  distanceKm: number;
  isCorrect: boolean;
  isNeighboring: boolean;
}): HeatColorToken {
  if (params.isCorrect) {
    return { level: "correct", color: CORRECT_COLOR };
  }

  if (params.isNeighboring) {
    return { level: "neighboring", color: HEAT_COLOR_PALETTE.neighboring };
  }

  return getHeatColorForDistance(params.distanceKm);
}

export function getNeutralColorToken(): HeatColorToken {
  return { level: "neutral", color: COUNTRY_NEUTRAL_COLOR };
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function blendHexColors(leftHex: string, rightHex: string, amount: number): string {
  const left = hexToRgb(leftHex);
  const right = hexToRgb(rightHex);

  if (!left || !right) {
    return leftHex;
  }

  const mixed = {
    red: Math.round(left.red + (right.red - left.red) * amount),
    green: Math.round(left.green + (right.green - left.green) * amount),
    blue: Math.round(left.blue + (right.blue - left.blue) * amount),
  };

  return rgbToHex(mixed);
}

function hexToRgb(hex: string): { red: number; green: number; blue: number } | null {
  const normalized = hex.trim().replace(/^#/, "");

  if (normalized.length !== 6) {
    return null;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  if ([red, green, blue].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return { red, green, blue };
}

function rgbToHex(color: {
  red: number;
  green: number;
  blue: number;
}): string {
  const toHex = (channel: number) => channel.toString(16).padStart(2, "0");

  return `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`;
}

export function getHeatLabel(level: GuessHeatLevel): string {
  switch (level) {
    case "neutral":
      return "Neutral";
    case "far":
      return "Far";
    case "slightlyWarm":
      return "Slightly warm";
    case "warm":
      return "Warm";
    case "hot":
      return "Hot";
    case "neighboring":
      return "Neighboring";
    case "correct":
      return "Correct";
    default:
      return level;
  }
}
