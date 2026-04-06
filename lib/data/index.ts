import type { Country, GameItem } from "../../types/game.ts";
import { countryCentroidSeeds, countrySeeds, itemSeeds } from "./raw.ts";
import { normalizeCountryKey } from "./normalize.ts";

type CountryLookup = {
  byCode: Map<string, Country>;
  byName: Map<string, Country>;
};

function buildCountryLookup(): CountryLookup {
  const mergedCountries = countrySeeds.map((country) => {
    const centroid = countryCentroidSeeds.find(
      (entry) => entry.code === country.code,
    );

    if (!centroid) {
      throw new Error(`Missing centroid data for country code: ${country.code}`);
    }

    return {
      code: country.code,
      name: country.name,
      aliases: [...country.aliases],
      centroid: {
        latitude: centroid.latitude,
        longitude: centroid.longitude,
      },
    };
  });

  const byCode = new Map<string, Country>();
  const byName = new Map<string, Country>();

  for (const country of mergedCountries) {
    byCode.set(country.code, country);

    const namesToIndex = [country.name, ...country.aliases];
    for (const name of namesToIndex) {
      byName.set(normalizeCountryKey(name), country);
    }
  }

  return { byCode, byName };
}

const countryLookup = buildCountryLookup();

export function getItems(): GameItem[] {
  return itemSeeds.map((item) => ({ ...item }));
}

export function getCountries(): Country[] {
  return Array.from(countryLookup.byCode.values()).map((country) => ({
    ...country,
    aliases: [...country.aliases],
    centroid: { ...country.centroid },
  }));
}

export function getCountryByName(name: string): Country | undefined {
  return countryLookup.byName.get(normalizeCountryKey(name));
}

export function getCountryByCode(code: string): Country | undefined {
  return countryLookup.byCode.get(code.trim().toUpperCase());
}
