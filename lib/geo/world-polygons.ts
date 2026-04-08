import { getCountries, getCountryByCode, getCountryByName } from "../data/index.ts";
import { normalizeCountryKey } from "../data/normalize.ts";
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
  source: "alpha2" | "alpha3" | "name" | "alias" | "sovereign" | "fallback",
): number {
  const normalized = normalizeCountryKey(candidate);
  const countryName = normalizeCountryKey(country.name);
  const alpha3 = normalizeCountryKey(country.alpha3);
  const aliases = country.aliases.map((alias) => normalizeCountryKey(alias));

  if (source === "alpha2") {
    return 400;
  }

  if (source === "alpha3") {
    return 380;
  }

  if (normalized === countryName) {
    return source === "name" ? 320 : 260;
  }

  if (aliases.includes(normalized)) {
    return source === "alias" ? 290 : 240;
  }

  if (normalized === alpha3) {
    return 360;
  }

  if (source === "sovereign") {
    return 180;
  }

  return 10;
}

function resolveCountryFromFeature(
  feature: GeoJsonFeature,
): ResolvedCountryPolygon | null {
  const properties = feature.properties ?? {};
  let best: ResolvedCountryPolygon | null = null;

  const codeKeys: Array<[string, "alpha2" | "alpha3"]> = [
    ["ISO3166-1-Alpha-2", "alpha2"],
    ["iso_a2", "alpha2"],
    ["ISO_A2", "alpha2"],
    ["iso2", "alpha2"],
    ["ISO2", "alpha2"],
    ["adm0_a3", "alpha3"],
    ["ADM0_A3", "alpha3"],
    ["iso_a3", "alpha3"],
    ["ISO_A3", "alpha3"],
    ["sov_a3", "alpha3"],
    ["SOV_A3", "alpha3"],
    ["gu_a3", "alpha3"],
    ["GU_A3", "alpha3"],
  ];

  for (const [key, source] of codeKeys) {
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
        score: scoreMatch(candidate, country, source),
      };

      if (!best || resolved.score > best.score) {
        best = resolved;
      }
    }
  }

  const nameKeys: Array<[string, "name" | "alias" | "sovereign"]> = [
    ["name", "name"],
    ["NAME", "name"],
    ["admin", "name"],
    ["ADMIN", "name"],
    ["brk_name", "alias"],
    ["BRK_NAME", "alias"],
    ["formal_en", "alias"],
    ["FORMAL_EN", "alias"],
    ["name_long", "alias"],
    ["NAME_LONG", "alias"],
    ["name_sort", "alias"],
    ["NAME_SORT", "alias"],
    ["name_alt", "alias"],
    ["NAME_ALT", "alias"],
    ["abbrev", "alias"],
    ["ABBREV", "alias"],
    ["sovereignt", "sovereign"],
    ["SOVEREIGNT", "sovereign"],
    ["geounit", "alias"],
    ["GEOUNIT", "alias"],
    ["subunit", "alias"],
    ["SUBUNIT", "alias"],
  ];

  for (const [key, source] of nameKeys) {
    const candidate = readString(properties[key]);

    if (!candidate) {
      continue;
    }

    const country = getCountryByName(candidate);
    if (country) {
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
    const featureId = feature.id.trim();
    const countryByCode = getCountryByCode(featureId);
    const countryByName = countryByCode ?? getCountryByName(featureId);
    if (countryByName) {
      const source: "alpha2" | "alpha3" | "fallback" =
        featureId.length === 2
          ? "alpha2"
          : featureId.length === 3
            ? "alpha3"
            : "fallback";
      const resolved: ResolvedCountryPolygon = {
        country: countryByName,
        countryCode: countryByName.code,
        countryName: countryByName.name,
        featureName: resolveFeatureName(feature, countryByName),
        geometry: feature.geometry,
        score: scoreMatch(featureId, countryByName, source),
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
    "name_long",
    "NAME_LONG",
    "name_sort",
    "NAME_SORT",
    "name_alt",
    "NAME_ALT",
    "abbrev",
    "ABBREV",
    "sovereignt",
    "SOVEREIGNT",
    "geounit",
    "GEOUNIT",
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

function createFallbackGeometry(country: Country): GeoJsonPolygonGeometry {
  const latitudeRadians = (country.centroid.latitude * Math.PI) / 180;
  const latitudeScale = Math.max(Math.cos(latitudeRadians), 0.45);
  const latitudeDelta = 0.28;
  const longitudeDelta = 0.28 / latitudeScale;

  const { latitude, longitude } = country.centroid;

  return {
    type: "Polygon",
    coordinates: [
      [
        [longitude - longitudeDelta, latitude + latitudeDelta],
        [longitude + longitudeDelta, latitude + latitudeDelta],
        [longitude + longitudeDelta, latitude - latitudeDelta],
        [longitude - longitudeDelta, latitude - latitudeDelta],
        [longitude - longitudeDelta, latitude + latitudeDelta],
      ],
    ],
  };
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
    .map(
      (resolved): CountryPolygon => ({
        countryCode: resolved.countryCode,
        countryName: resolved.countryName,
        featureName: resolved.featureName,
        geometry: resolved.geometry,
      }),
    )
    .sort((left, right) => left.countryName.localeCompare(right.countryName));
}

function addFallbackCountryPolygons(polygons: CountryPolygon[]): CountryPolygon[] {
  const byCode = new Map(
    polygons.map((polygon) => [polygon.countryCode, polygon] as const),
  );

  for (const country of getCountries()) {
    if (byCode.has(country.code)) {
      continue;
    }

    byCode.set(country.code, {
      countryCode: country.code,
      countryName: country.name,
      featureName: country.name,
      geometry: createFallbackGeometry(country),
    });
  }

  return Array.from(byCode.values()).sort((left, right) =>
    left.countryName.localeCompare(right.countryName),
  );
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
      .then((data) =>
        addFallbackCountryPolygons(createCountryPolygons(data.features ?? [])),
      )
      .catch(() => []);
  }

  return countryPolygonsPromise;
}
