import countryBorderSamples from "../../data/country-border-samples.json" with {
  type: "json",
};
import { getCountryByCode } from "../data/index.ts";
import type { CountryCentroid } from "../../types/game.ts";
import { haversineKmExact } from "./haversine.ts";
import { filterMainlandBorderSamplePoints } from "./country-mainland.ts";

type CountryBorderSample = {
  code: string;
  points: Array<[number, number]>;
};

type CountryBorderSamplesData = {
  version: number;
  countries: CountryBorderSample[];
};

const samples = countryBorderSamples as CountryBorderSamplesData;
const sampleByCode = new Map(
  samples.countries.map((entry) => [entry.code.trim().toUpperCase(), entry] as const),
);
const distanceCache = new Map<string, number>();

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function pairKey(leftCode: string, rightCode: string): string {
  return [leftCode, rightCode].sort().join(":");
}

function getFallbackDistance(
  left: CountryCentroid,
  right: CountryCentroid,
): number {
  return Math.round(haversineKmExact(left, right));
}

function getBorderSamplePoints(
  countryCode: string,
): Array<[number, number]> | null {
  const sample = sampleByCode.get(normalizeCode(countryCode));

  if (!sample || sample.points.length === 0) {
    return null;
  }

  const mainlandPoints = filterMainlandBorderSamplePoints(
    sample.code,
    sample.points,
  );

  return mainlandPoints.length > 0 ? mainlandPoints : null;
}

export function getBorderDistanceKm(
  leftCountryCode: string,
  rightCountryCode: string,
): number {
  const leftResolved = getCountryByCode(leftCountryCode);
  const rightResolved = getCountryByCode(rightCountryCode);
  const leftCode = normalizeCode(leftResolved?.code ?? leftCountryCode);
  const rightCode = normalizeCode(rightResolved?.code ?? rightCountryCode);

  if (!leftCode || !rightCode) {
    return Number.POSITIVE_INFINITY;
  }

  if (leftCode === rightCode) {
    return 0;
  }

  const key = pairKey(leftCode, rightCode);
  const cached = distanceCache.get(key);

  if (typeof cached === "number") {
    return cached;
  }

  const leftSamplePoints = getBorderSamplePoints(leftCode);
  const rightSamplePoints = getBorderSamplePoints(rightCode);

  if (!leftSamplePoints || !rightSamplePoints) {
    const leftCountry = getCountryByCode(leftCode);
    const rightCountry = getCountryByCode(rightCode);

    if (!leftCountry || !rightCountry) {
      return Number.POSITIVE_INFINITY;
    }

    const fallbackDistance = getFallbackDistance(
      leftCountry.centroid,
      rightCountry.centroid,
    );

    distanceCache.set(key, fallbackDistance);
    return fallbackDistance;
  }

  let minimumDistance = Number.POSITIVE_INFINITY;

  for (const [leftLongitude, leftLatitude] of leftSamplePoints) {
    const leftPoint: CountryCentroid = {
      latitude: leftLatitude,
      longitude: leftLongitude,
    };

    for (const [rightLongitude, rightLatitude] of rightSamplePoints) {
      const rightPoint: CountryCentroid = {
        latitude: rightLatitude,
        longitude: rightLongitude,
      };

      const distance = haversineKmExact(leftPoint, rightPoint);

      if (distance < minimumDistance) {
        minimumDistance = distance;
      }
    }
  }

  const roundedDistance = Number.isFinite(minimumDistance)
    ? Math.round(minimumDistance)
    : Number.POSITIVE_INFINITY;

  distanceCache.set(key, roundedDistance);

  return roundedDistance;
}
