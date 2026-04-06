import { getCountryByCode, getCountryByName } from "../data/index.ts";
import type { Country } from "../../types/game.ts";

type GeoJsonPolygonGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

type GeoJsonFeature = {
  type: "Feature";
  geometry: GeoJsonPolygonGeometry;
  properties?: Record<string, unknown>;
  id?: string | number | null;
};

type ResolvedCountryPolygon = {
  country: Country;
  countryCode: string;
  countryName: string;
  featureName: string;
  geometry: GeoJsonPolygonGeometry;
  score: number;
};

export type CountryPolygon = {
  countryCode: string;
  countryName: string;
  featureName: string;
  geometry: GeoJsonPolygonGeometry;
};

const COUNTRY_GEOJSON_URL = "/geo/ne_110m_admin_0_countries.geojson";

let countryPolygonsPromise: Promise<CountryPolygon[]> | null = null;

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function scoreMatch(
  candidate: string,
  country: Country,
  source: "code" | "name" | "alias" | "sovereign" | "fallback",
): number {
  const normalized = candidate.toLowerCase();
  const countryName = country.name.toLowerCase();
  const aliases = country.aliases.map((alias) => alias.toLowerCase());

  if (source === "code") {
    return 400;
  }

  if (normalized === countryName) {
    return source === "name" ? 300 : 250;
  }

  if (aliases.includes(normalized)) {
    return source === "alias" ? 260 : 220;
  }

  if (source === "sovereign") {
    return 120;
  }

  return 10;
}

function resolveCountryFromFeature(
  feature: GeoJsonFeature,
): ResolvedCountryPolygon | null {
  const properties = feature.properties ?? {};
  let best: ResolvedCountryPolygon | null = null;

  const codeKeys = [
    "ISO3166-1-Alpha-2",
    "iso_a2",
    "ISO_A2",
    "iso2",
    "ISO2",
    "adm0_a3",
    "ADM0_A3",
  ];

  for (const key of codeKeys) {
    const candidate = readString(properties[key]);

    if (!candidate) {
      continue;
    }

    const country = getCountryByCode(candidate);
    if (country) {
      const resolved: ResolvedCountryPolygon = {
        country,
        countryCode: country.code,
        countryName: country.name,
        featureName: resolveFeatureName(feature, country),
        geometry: feature.geometry,
        score: scoreMatch(candidate, country, "code"),
      };

      if (!best || resolved.score > best.score) {
        best = resolved;
      }
    }
  }

  const nameKeys = [
    "name",
    "NAME",
    "admin",
    "ADMIN",
    "brk_name",
    "BRK_NAME",
    "formal_en",
    "FORMAL_EN",
    "sovereignt",
    "SOVEREIGNT",
    "geounit",
    "GEUNIT",
    "subunit",
    "SUBUNIT",
  ];

  for (const key of nameKeys) {
    const candidate = readString(properties[key]);

    if (!candidate) {
      continue;
    }

    const country = getCountryByName(candidate);
    if (country) {
      const source =
        key === "sovereignt" || key === "SOVEREIGNT" ? "sovereign" : "name";
      const resolved: ResolvedCountryPolygon = {
        country,
        countryCode: country.code,
        countryName: country.name,
        featureName: resolveFeatureName(feature, country),
        geometry: feature.geometry,
        score: scoreMatch(candidate, country, source),
      };

      if (!best || resolved.score > best.score) {
        best = resolved;
      }
    }
  }

  if (typeof feature.id === "string") {
    const country = getCountryByName(feature.id);
    if (country) {
      const resolved: ResolvedCountryPolygon = {
        country,
        countryCode: country.code,
        countryName: country.name,
        featureName: resolveFeatureName(feature, country),
        geometry: feature.geometry,
        score: scoreMatch(feature.id, country, "fallback"),
      };

      if (!best || resolved.score > best.score) {
        best = resolved;
      }
    }
  }

  return best;
}

function resolveFeatureName(feature: GeoJsonFeature, country: Country): string {
  const properties = feature.properties ?? {};

  const nameKeys = [
    "name",
    "NAME",
    "admin",
    "ADMIN",
    "brk_name",
    "BRK_NAME",
    "formal_en",
    "FORMAL_EN",
    "sovereignt",
    "SOVEREIGNT",
    "geounit",
    "GEUNIT",
    "subunit",
    "SUBUNIT",
  ];

  for (const key of nameKeys) {
    const candidate = readString(properties[key]);

    if (candidate) {
      return candidate;
    }
  }

  if (typeof feature.id === "string" && feature.id.trim()) {
    return feature.id.trim();
  }

  return country.name;
}

export function createCountryPolygons(
  features: GeoJsonFeature[],
): CountryPolygon[] {
  const byCode = new Map<string, ResolvedCountryPolygon>();

  for (const feature of features) {
    if (
      !feature.geometry ||
      (feature.geometry.type !== "Polygon" &&
        feature.geometry.type !== "MultiPolygon")
    ) {
      continue;
    }

    const country = resolveCountryFromFeature(feature);

    if (!country) {
      continue;
    }

    const existing = byCode.get(country.countryCode);

    if (!existing || country.score > existing.score) {
      byCode.set(country.countryCode, country);
    }
  }

  return Array.from(byCode.values())
    .map(({ score: _score, country: _country, ...polygon }) => polygon)
    .sort((left, right) => left.countryName.localeCompare(right.countryName));
}

export async function loadCountryPolygons(): Promise<CountryPolygon[]> {
  if (!countryPolygonsPromise) {
    countryPolygonsPromise = fetch(COUNTRY_GEOJSON_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to load country polygons: ${response.status} ${response.statusText}`,
          );
        }

        return response.json() as Promise<{ features: GeoJsonFeature[] }>;
      })
      .then((data) => createCountryPolygons(data.features ?? []))
      .catch(() => []);
  }

  return countryPolygonsPromise;
}
