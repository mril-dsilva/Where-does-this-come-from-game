export type GuessHeatLevel =
  | "neutral"
  | "far"
  | "faintWarm"
  | "slightlyWarm"
  | "mediumWarm"
  | "warm"
  | "strongWarm"
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
  strongWarm: "#d94f43",
  warm: "#e56d5d",
  mediumWarm: "#e78a79",
  slightlyWarm: "#f0ad9f",
  faintWarm: "#f6cfc5",
  far: "#f8eae6",
} as const;

const HEAT_DECAY_KM = 2_200;
const HEAT_BANDS = [
  {
    level: "far" as const,
    lowerScore: 0,
    upperScore: 0.1,
    lowerColor: HEAT_COLOR_PALETTE.far,
    upperColor: HEAT_COLOR_PALETTE.faintWarm,
  },
  {
    level: "faintWarm" as const,
    lowerScore: 0.1,
    upperScore: 0.2,
    lowerColor: HEAT_COLOR_PALETTE.faintWarm,
    upperColor: HEAT_COLOR_PALETTE.slightlyWarm,
  },
  {
    level: "slightlyWarm" as const,
    lowerScore: 0.2,
    upperScore: 0.32,
    lowerColor: HEAT_COLOR_PALETTE.slightlyWarm,
    upperColor: HEAT_COLOR_PALETTE.mediumWarm,
  },
  {
    level: "mediumWarm" as const,
    lowerScore: 0.32,
    upperScore: 0.46,
    lowerColor: HEAT_COLOR_PALETTE.mediumWarm,
    upperColor: HEAT_COLOR_PALETTE.warm,
  },
  {
    level: "warm" as const,
    lowerScore: 0.46,
    upperScore: 0.62,
    lowerColor: HEAT_COLOR_PALETTE.warm,
    upperColor: HEAT_COLOR_PALETTE.strongWarm,
  },
  {
    level: "strongWarm" as const,
    lowerScore: 0.62,
    upperScore: 0.78,
    lowerColor: HEAT_COLOR_PALETTE.strongWarm,
    upperColor: HEAT_COLOR_PALETTE.hot,
  },
  {
    level: "hot" as const,
    lowerScore: 0.78,
    upperScore: 1,
    lowerColor: HEAT_COLOR_PALETTE.strongWarm,
    upperColor: HEAT_COLOR_PALETTE.hot,
  },
] as const;

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

  for (let index = HEAT_BANDS.length - 1; index >= 0; index -= 1) {
    const band = HEAT_BANDS[index];

    if (score < band.lowerScore) {
      continue;
    }

    const amount = clamp01(
      (score - band.lowerScore) / (band.upperScore - band.lowerScore),
    );

    return {
      level: band.level,
      color: blendHexColors(band.lowerColor, band.upperColor, amount),
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
    case "faintWarm":
      return "Barely warm";
    case "slightlyWarm":
      return "Slightly warm";
    case "mediumWarm":
      return "Medium warm";
    case "warm":
      return "Warm";
    case "strongWarm":
      return "Strong warm";
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
