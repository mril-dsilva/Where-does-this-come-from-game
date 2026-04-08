import countryCentroidsSeed from "../../data/country-centroids.json" with {
  type: "json",
};
import countriesSeed from "../../data/countries.json" with { type: "json" };
import itemsSeed from "../../data/items.json" with { type: "json" };
import type { Country, GameItem } from "../../types/game.ts";

type CountrySeed = Pick<Country, "code" | "alpha3" | "name" | "aliases">;
type CountryCentroidSeed = {
  code: string;
  latitude: number;
  longitude: number;
};

export const itemSeeds = itemsSeed as GameItem[];
export const countrySeeds = countriesSeed as CountrySeed[];
export const countryCentroidSeeds = countryCentroidsSeed as CountryCentroidSeed[];
