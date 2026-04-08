import type { Country } from "../../types/game.ts";
import { getCountries } from "./index.ts";
import { normalizeCountryKey } from "./normalize.ts";

export type CountrySuggestionReason = "exact" | "alias" | "fuzzy";

export type CountrySuggestion = {
  country: Country;
  matchedValue: string;
  score: number;
  reason: CountrySuggestionReason;
  editDistance: number;
};

export type CountryMatchResult = {
  query: string;
  normalizedQuery: string;
  suggestions: CountrySuggestion[];
  exactMatch: CountrySuggestion | null;
  didYouMean: CountrySuggestion | null;
};

export type ResolveCountryMatchResult = CountryMatchResult & {
  country: Country | null;
  matchType: "exact" | "approximate" | "suggestion" | "unmatched";
};

const DEFAULT_LIMIT = 6;
const SUGGESTION_THRESHOLD = 0.75;
const APPROXIMATE_RESOLVE_THRESHOLD = 0.8;
function compactKey(value: string): string {
  return normalizeCountryKey(value).replace(/\s+/g, "");
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;

  const previousRow = Array.from({ length: right.length + 1 }, (_, index) =>
    index,
  );

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let previousDiagonal = previousRow[0];
    previousRow[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const temp = previousRow[rightIndex];
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      previousRow[rightIndex] = Math.min(
        previousRow[rightIndex] + 1,
        previousRow[rightIndex - 1] + 1,
        previousDiagonal + cost,
      );
      previousDiagonal = temp;
    }
  }

  return previousRow[right.length];
}

function scoreCandidate(query: string, candidate: string): {
  score: number;
  reason: CountrySuggestionReason;
  editDistance: number;
} | null {
  const normalizedQuery = compactKey(query);
  const normalizedCandidate = compactKey(candidate);

  if (!normalizedQuery || !normalizedCandidate) {
    return null;
  }

  if (normalizedQuery === normalizedCandidate) {
    return { score: 1, reason: "exact", editDistance: 0 };
  }

  const editDistance = levenshteinDistance(
    normalizedQuery,
    normalizedCandidate,
  );
  const maxLength = Math.max(normalizedQuery.length, normalizedCandidate.length);
  const similarity = 1 - editDistance / maxLength;
  const prefixBonus =
    normalizedCandidate.startsWith(normalizedQuery) ||
    normalizedQuery.startsWith(normalizedCandidate)
      ? 0.06
      : 0;
  const containmentBonus =
    normalizedCandidate.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedCandidate)
      ? 0.04
      : 0;
  const score = Math.min(0.99, similarity + prefixBonus + containmentBonus);

  return {
    score,
    reason:
      normalizedCandidate.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedCandidate)
        ? "alias"
        : "fuzzy",
    editDistance,
  };
}

function pickCountrySuggestion(
  query: string,
  country: Country,
): CountrySuggestion | null {
  const candidates = [country.code, country.alpha3, country.name, ...country.aliases];
  let best: CountrySuggestion | null = null;

  for (const candidate of candidates) {
    const scored = scoreCandidate(query, candidate);

    if (!scored) {
      continue;
    }

    if (!best || scored.score > best.score) {
      best = {
        country,
        matchedValue: candidate,
        ...scored,
      };
    }
  }

  return best;
}

export function getCountrySuggestions(
  query: string,
  options?: {
    excludeCodes?: string[];
    limit?: number;
  },
): CountryMatchResult {
  const normalizedQuery = normalizeCountryKey(query);
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const excludedCodes = new Set(
    (options?.excludeCodes ?? []).map((code) => code.trim().toUpperCase()),
  );

  if (!normalizedQuery) {
    return {
      query,
      normalizedQuery,
      suggestions: [],
      exactMatch: null,
      didYouMean: null,
    };
  }

  const suggestions = getCountries()
    .filter((country) => !excludedCodes.has(country.code))
    .map((country) => pickCountrySuggestion(query, country))
    .filter((suggestion): suggestion is CountrySuggestion => suggestion !== null)
    .filter((suggestion) => suggestion.score >= SUGGESTION_THRESHOLD)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.country.name.localeCompare(right.country.name);
    })
    .slice(0, limit);

  const exactMatch = suggestions.find((suggestion) => suggestion.reason === "exact") ?? null;
  const didYouMean =
    exactMatch
      ? null
      : suggestions[0] && suggestions[0].score >= SUGGESTION_THRESHOLD
        ? suggestions[0]
        : null;

  return {
    query,
    normalizedQuery,
    suggestions,
    exactMatch,
    didYouMean,
  };
}

export function resolveCountryMatch(
  query: string,
  options?: {
    excludeCodes?: string[];
  },
): ResolveCountryMatchResult {
  const result = getCountrySuggestions(query, options);
  const topSuggestion = result.suggestions[0] ?? null;

  if (result.exactMatch) {
    return {
      ...result,
      country: result.exactMatch.country,
      matchType: "exact",
    };
  }

  if (topSuggestion && topSuggestion.score >= APPROXIMATE_RESOLVE_THRESHOLD) {
    return {
      ...result,
      country: topSuggestion.country,
      matchType: "approximate",
    };
  }

  return {
    ...result,
    country: null,
    matchType: topSuggestion ? "suggestion" : "unmatched",
  };
}
