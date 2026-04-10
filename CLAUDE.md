# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.\n
## Project Overview

OriginGuessr is a geography guessing game built with Next.js, TypeScript, and Tailwind CSS. Players guess the country of origin for items (foods, inventions, brands) and receive heat-based feedback on a 3D globe powered by `react-globe.gl`.

## Development Commands

```bash
# Start development server
npm run dev

# Run tests (Node.js built-in test runner with TypeScript)
npm test

# Run a single test file
node --test --experimental-strip-types tests/game-logic.test.ts

# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Architecture

### Data Flow

The game follows a unidirectional data flow:

1. **Data Layer** (`lib/data/`) - JSON seed data with lookup helpers
2. **Game Logic** (`lib/game/`) - Pure functions for state transitions
3. **Geo Logic** (`lib/geo/`) - Distance calculations and polygon handling
4. **Components** (`components/`) - UI layer with React state

### Key Architectural Decisions

**Country Resolution with Fuzzy Matching**
- `lib/data/country-match.ts` implements Levenshtein distance-based matching
- Aliases resolve through multiple name variations (e.g., "UK", "Great Britain" → "GB")
- Threshold: 0.8 similarity for auto-resolution, 0.75 for suggestions

**Distance Calculation Strategy**
- Primary: Border sample points (`data/country-border-samples.json`) for accuracy
- Fallback: Haversine distance between centroids when border data is missing
- Neighboring countries get a special "neighboring" heat tier regardless of centroid distance

**Heat Color System**
- Exponential decay based on distance: `score = exp(-distance / 2200km)`
- 9 tiers from "far" (lightest) to "correct" (green)
- Colors interpolated between band boundaries for smooth gradients

**Globe Highlighting**
- Polygon data loaded from GeoJSON in `public/geo/`
- Each guess gets a color based on heat level and altitude based on recency
- Latest guess gets a brighter stroke and higher altitude

### Module Boundaries

| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| `lib/data/` | Data access, normalization, matching | `index.ts`, `country-match.ts`, `raw.ts` |
| `lib/game/` | Game state, guess evaluation, heat logic | `state.ts`, `guess.ts`, `heat.ts` |
| `lib/geo/` | Distance calculations, polygons | `border-distance.ts`, `haversine.ts`, `world-polygons.ts` |
| `components/game/` | Gameplay UI | `GameShell.tsx`, `GuessInput.tsx`, `WorldGlobe.tsx` |
| `components/site/` | Landing/marketing UI | `OriginGuessrApp.tsx`, `LandingScreen.tsx` |
| `components/globe/` | Globe visualization | `WorldGlobe.tsx`, `GlobeLegend.tsx` |

### State Management

Game state is managed in `GameShell` with pure reducer-style functions:

```typescript
// GameState (types/game.ts)
{
  activeItemId: string | null;
  activeItem: GameItem | null;
  guesses: GuessRecord[];
  isComplete: boolean;
  createdAt: string;
  completedAt: string | null;
}

// Submit guess
const result = submitGuess({ state, guess, now });
// Returns: { state, evaluation, wasRecorded }
```

Guesses are automatically sorted by distance (closest first) after each submission.

## Testing Patterns

Tests use Node.js built-in test runner (`node --test`):

```typescript
import test from "node:test";
import assert from "node:assert/strict";

test("description", () => {
  assert.equal(actual, expected);
});
```

Common test patterns in this codebase:
- Country lookup validation (aliases, codes, fuzzy matching)
- Heat color tier verification at distance boundaries
- Game state transitions (guess → complete)
- Border distance vs centroid distance comparisons

## Code Style Notes

- TypeScript with explicit `.ts` extensions in imports
- Path alias `@/*` maps to root directory
- Prefer small, pure functions over class abstractions
- Keep game logic separate from UI components
- Do not import JSON directly from components; use `lib/data` helpers

## Project Structure Reference

```
app/                    # Next.js App Router (thin pages)
components/
  game/                 # Gameplay UI components
  globe/                # Globe visualization
  site/                 # Landing page components
data/                   # JSON seed data (countries, items, border samples)
lib/
  data/                 # Data access layer
  game/                 # Game logic (pure functions)
  geo/                  # Geographic calculations
public/geo/             # GeoJSON polygon files
types/                  # Shared TypeScript types
```
