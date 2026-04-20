# AGENTS.md

## Project Identity
OriginGuessr is a globe-based geography game about tracing everyday things back to their country of origin. It is built for a single-player, round-based experience where local seed data, country matching, and geo distance logic produce immediate feedback as the player guesses.

The app is intentionally self-contained: there is no backend API, no database, and no authentication layer. The current product is a polished frontend portfolio game with local content, local persistence for settings, and client-side globe rendering.

## Tech Stack
| Layer | Technology | Version | Notes |
|---|---|---:|---|
| Runtime | Node.js | Not pinned in repo | Used through `npm` scripts and Next.js tooling. |
| Package manager | npm | Not pinned in repo | `package-lock.json` is committed. |
| Framework | Next.js | 16.2.2 | App Router in `app/`; `next dev`, `next build`, `next start`. |
| UI library | React | 19.2.4 | Client components drive gameplay and settings. |
| Language | TypeScript | 5.x | `strict: true`, `allowImportingTsExtensions: true`. |
| Database | None | N/A | All content is local JSON and in-memory module state. |
| ORM | None | N/A | No ORM, migrations, or SQL layer exist. |
| State management | React state + localStorage | N/A | `useState`, `useEffect`, `useMemo`, module caches, and `localStorage`. |
| Auth | None | N/A | No login, sessions, or server auth flow. |
| Hosting/deploy target | Vercel | Not encoded in repo | README says the app is ready for Vercel; no workflow file exists. |
| Testing framework | `node:test` | Built into Node | Run with `npm test`. |
| Linting | ESLint | 9.x | Uses `eslint-config-next`. |
| CSS approach | Tailwind CSS 4 + CSS variables | 4.x | `app/globals.css` defines the theme tokens and animations. |
| 3D globe | `react-globe.gl` + `three` | 2.36.0 / 0.180.0 | Globe is client-only and loads country polygons at runtime. |

## Repository Structure
- `app/` is the Next.js App Router shell. `app/layout.tsx` sets metadata, fonts, and the theme bootstrap script; `app/page.tsx` is the homepage entrypoint; `app/globals.css` owns global tokens, dark/light theme variables, and animation keyframes. Almost never modify `app/globals.css` casually because multiple UI classes assume those CSS variables exist.
- `components/` owns presentation. `components/site/` contains the landing screen, settings toggles, and the app wrapper; `components/game/` owns round flow, guesses, feedback, and solved-state UI; `components/globe/` owns the globe rendering and legend. Treat `components/game/GameShell.tsx` and `components/globe/WorldGlobe.tsx` as load-bearing.
- `lib/` owns all non-UI logic. `lib/data/` handles seed loading, normalization, and country matching; `lib/game/` handles guess resolution, heat levels, and round state; `lib/geo/` handles distance, borders, and polygon loading; `lib/settings/` handles persisted UI settings and theme bootstrapping.
- `data/` is the local seed source of truth. `data/items.json`, `data/countries.json`, `data/country-centroids.json`, and `data/country-border-samples.json` feed the runtime helpers and the tests. Almost never modify `data/` without checking the matching logic and tests first.
- `public/` contains static assets. `public/geo/ne_110m_admin_0_countries.geojson` is required for country polygons; the other SVGs are default Next assets. Almost never move or rename `public/geo/` without updating `lib/geo/world-polygons.ts`.
- `tests/` contains Node test files for game logic, settings, and polygon resolution. These are the best safety net for changes in `lib/`.
- `types/` contains shared domain types. `types/game.ts` defines the shapes used across data, game, and UI layers.
- Top-level config files such as `package.json`, `next.config.ts`, `eslint.config.mjs`, and `tsconfig.json` are standard project config and should only change when the toolchain changes.

## Critical Commands
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build production bundle: `npm run build`
- Run tests: `npm test`
- Run lint: `npm run lint`
- Database migrate: none; this repo has no database or migration command.
- Database seed: none; local content comes from `data/*.json`.
- Deploy: none in-repo; the project is intended for external deployment on Vercel, and the repo does not define a deploy script.

Order that matters:
- Run `npm install` before anything else.
- Use `npm run build` before `npm start` if you want to verify production output locally.

Destructive commands:
- None of the documented commands are destructive.

## Build & Deploy Pipeline — DEEP MAP
- Local dev startup sequence:
  - `npm install` restores dependencies from `package-lock.json`.
  - `npm run dev` runs `next dev`.
  - Next loads the App Router entrypoints in `app/layout.tsx` and `app/page.tsx`.
  - `components/site/OriginGuessrApp.tsx` mounts the landing screen and lazily switches into `components/game/GameShell.tsx`.
  - `lib/settings/game-settings.ts` injects the theme bootstrap script before hydration so the initial `data-theme` matches saved settings.
  - `components/site/useGameSettings.ts` reads and writes the same settings again on the client after mount.
  - `components/globe/WorldGlobe.tsx` stays client-only because `react-globe.gl` is dynamically imported with `ssr: false`.
- Production build sequence:
  - `npm run build` runs `next build`.
  - Next compiles the App Router tree, bundles client and server code, and checks the TypeScript/route types that Next generates.
  - `npm start` runs `next start` against the built output.
  - Static assets under `public/` are served as-is.
  - The globe still loads country polygons at runtime from `/geo/ne_110m_admin_0_countries.geojson`.
- Environment-specific differences:
  - Dev uses `next dev` and HMR; prod uses the built output from `next build`.
  - Theme state is read from `localStorage` only in the browser; the bootstrap script in `app/layout.tsx` bridges the first paint.
  - Globe rendering is always client-side because of the dynamic import in `components/globe/WorldGlobe.tsx`.
  - External globe textures come from `unpkg.com` URLs in `components/globe/WorldGlobe.tsx`; offline or blocked network access degrades the visual, not the game logic.
- CI/CD:
  - No `.github/workflows/` directory exists in the repo.
  - No Dockerfile or Makefile exists in the repo.
  - No package scripts named `prebuild`, `postbuild`, `pretest`, or `posttest` exist.
  - There is no repo-managed deploy pipeline; Vercel is only mentioned in the README.
  - A build failure means the Next app or TypeScript checks are broken.
- Any pre-build or post-build steps that are easy to accidentally skip:
  - There are no codegen or data-generation scripts.
  - There is no migration or seed step.
  - If you change the seed JSON files, the runtime helpers and tests are the only validation path.
  - If you change `public/geo/ne_110m_admin_0_countries.geojson`, the globe can silently lose polygons until the asset is restored.
- ⚠️ KNOWN GOTCHAS:
  - `lib/geo/world-polygons.ts` caches the fetch result in `countryPolygonsPromise`; if the first fetch fails, the session keeps the empty fallback array until reload.
  - `components/game/GameShell.tsx` relies on `key={sessionId}` in `components/site/OriginGuessrApp.tsx` to fully reset round state on replay.
  - `app/globals.css` sets `body { zoom: 0.8; }`; removing it changes the whole layout.
  - `components/site/useGameSettings.ts` writes theme state into `document.documentElement`; breaking this desynchronizes the first paint from the persisted setting.
  - `WorldGlobe` depends on remote textures from `unpkg.com`; CSP or network restrictions affect visuals.

## Database & Models — DEEP MAP
- Database engine and connection approach
  - None. There is no database connection, ORM client, migration tool, or server API in this repo.
  - All canonical content comes from local JSON files imported by `lib/data/raw.ts`.
- List of all models/tables with their key fields and types
  - `types/game.ts` defines the runtime domain models:
    - `GameItem`: `id`, `name`, `emoji`, `category`, `originCountryCode`, `originCountryName`, `fact`
    - `CountryCentroid`: `latitude`, `longitude`
    - `Country`: `code`, `alpha3`, `name`, `aliases`, `centroid`
    - `GuessRecord`: `id`, `guess`, `normalizedGuess`, `countryCode`, `countryName`, `distanceKm`, `heatLevel`, `heatColor`, `isCorrect`, `createdAt`
    - `GameState`: `activeItemId`, `activeItem`, `guesses`, `isComplete`, `createdAt`, `completedAt`
- Entity relationships map
  - `GameItem.originCountryCode` points to `Country.code`.
  - `GuessRecord.countryCode` points to `Country.code` after guess resolution.
  - `Country.centroid` is merged from `data/countries.json` and `data/country-centroids.json` in `lib/data/index.ts`.
  - `lib/data/country-match.ts` resolves country names, alpha-2 codes, alpha-3 codes, and aliases into the same `Country`.
  - `lib/geo/world-polygons.ts` maps GeoJSON features to `Country` by code and name fields, then adds fallback geometry for missing countries.
  - `lib/geo/border-distance.ts` uses country border samples plus mainland filters for certain countries, then falls back to centroid distance when needed.
- Migration system: how migrations are created, tracked, and applied
  - None. There are no migrations.
- Any raw SQL usage and where it lives
  - None. There is no SQL in the repository.
- Seeding / fixture approach for dev and test environments
  - `lib/data/raw.ts` imports `data/countries.json`, `data/country-centroids.json`, and `data/items.json` directly with JSON import assertions.
  - `lib/geo/border-distance.ts` imports `data/country-border-samples.json`.
  - Tests depend on specific seed items such as `lego` and `ikea` in `tests/game-logic.test.ts`.
- ⚠️ KNOWN GOTCHAS:
  - `buildCountryLookup()` throws if a country centroid is missing, so a single bad seed entry breaks startup.
  - `getCountryByCode()` accepts both alpha-2 and alpha-3 codes, so collisions or malformed codes can affect matching.
  - `getBorderDistanceKm()` caches distances in module scope; changed border data does not recompute until reload.
  - Mainland overrides in `lib/geo/country-mainland.ts` are intentionally hardcoded for a small set of countries.
  - `loadCountryPolygons()` silently falls back to `[]` on fetch failure, which can hide asset/path problems.

## State Management & Data Flow — DEEP MAP
- Where global state lives and what it contains
  - `components/site/OriginGuessrApp.tsx` owns the top-level screen mode, selected item, and replay session key.
  - `components/game/GameShell.tsx` owns per-round UI state such as guess input, confetti, focus, solved popup visibility, and duplicate feedback.
  - `components/site/useGameSettings.ts` owns persistent settings for `assistInput` and `lightMode`.
  - Module-scope caches live in `lib/data/index.ts`, `lib/geo/border-distance.ts`, and `lib/geo/world-polygons.ts`.
- Data flow diagram in text
  - `data/*.json` → `lib/data/raw.ts` → `lib/data/index.ts` / `lib/data/country-match.ts`
  - `GameItem` selection in `components/site/OriginGuessrApp.tsx`
  - `GameState` creation and mutation in `components/game/GameShell.tsx` → `lib/game/state.ts` / `lib/game/guess.ts`
  - Geo scoring in `lib/geo/border-distance.ts` / `lib/geo/country-neighbors.ts`
  - UI rendering in `components/game/*` and `components/globe/WorldGlobe.tsx`
- Any caching strategy and cache invalidation approach
  - `lib/data/index.ts` builds a module-scope country lookup once.
  - `lib/geo/border-distance.ts` memoizes pairwise distances in a module-scope `Map`.
  - `lib/geo/world-polygons.ts` memoizes the fetch promise for the GeoJSON asset.
  - React `useMemo` is used heavily for derived UI data, including globe highlights, suggestions, reel items, and labels.
  - There is no React Query, SWR, Redux, Zustand, or server cache.
- Real-time data (if any): mechanism, what triggers updates
  - There is no server push, WebSocket, SSE, or polling layer.
  - The only live updates are local state transitions, `requestAnimationFrame`, and `setTimeout` in `components/game/GameClueStrip.tsx`, `components/game/ConfettiBurst.tsx`, `components/game/GameShell.tsx`, and `components/site/LandingHeroReel.tsx`.
- Any state duplication between layers
  - `GameShell` duplicates derived round state in local UI flags such as `showGameplay`, `showSolvedPopup`, `duplicateFeedbackCountry`, `latestSubmittedCountryCode`, and `focusedCountryCode`.
  - `GuessRecord` stores both the normalized guess and the resolved country fields.
  - Globe focus is intentionally duplicated between `focusedCountryCode` and `latestSubmittedCountryCode`.
  - Persisted theme state is duplicated between `localStorage` and `document.documentElement.dataset.theme`.
- ⚠️ KNOWN GOTCHAS:
  - `duplicateFeedbackCountry` overrides normal comparison feedback until it is cleared.
  - `showGameplay` controls body scroll locking, so changes to reveal timing can freeze or unfreeze the page incorrectly.
  - `GameClueStrip` notifies the parent only after the reel settles and the name is shown; changing those timers breaks the round transition.
  - `WorldGlobe` focus uses the latest clicked or guessed country code, so highlight order matters.
  - Guess history sorting is intentionally separate from feedback sorting; do not assume one order serves both.

## Environment Variables
| Variable name | Purpose | Required? | Default | Where it's used |
|---|---|---:|---|---|
| None | No runtime environment variables are read by the current codebase. | No | N/A | N/A |

## Patterns Claude Code Must Follow
- File naming
  - UI components live in `components/<area>/Name.tsx`.
  - Pure helpers live in `lib/<domain>/name.ts`.
```ts
components/game/GuessInput.tsx
lib/geo/border-distance.ts
```
- Component/module structure
  - Keep presentation in `components/` and keep logic in `lib/`.
  - Use `lib/data` as the only entry point for seed access from UI.
```ts
import { getItems } from "@/lib/data/index.ts";
export default function OriginGuessrApp() { /* ... */ }
```
- Error handling pattern
  - Throw early when an invariant is violated in pure logic.
  - Swallow non-critical browser persistence failures so the session stays usable.
```ts
throw new Error(`Missing centroid data for country code: ${country.code}`);
catch { /* Ignore storage failures and keep the session usable. */ }
```
- API response shape
  - There is no HTTP API in this repo.
  - Helper outputs are plain typed objects and discriminated unions, not classes or wrapped responses.
```ts
return { country: result.exactMatch.country, matchType: "exact" };
return { suggestions, exactMatch, didYouMean };
```
- How new environment variables should be added
  - There is no existing env module.
  - If a new env var is introduced, keep it in a single server-only `lib/` helper and do not read `process.env` from client components.
```ts
export const MY_FLAG = process.env.MY_FLAG === "1";
export const API_URL = process.env.API_URL ?? "";
```

## Patterns Claude Code Must NOT Do
- Do not import raw JSON directly into UI components. `lib/data/raw.ts` and `lib/data/index.ts` exist to centralize normalization and cloning.
- Do not move guess resolution, distance math, or heat scoring into components. Those rules belong in `lib/game/` and `lib/geo/`.
- Do not change `GAME_SETTINGS_STORAGE_KEY` casually. Doing so invalidates every saved assist/theme preference in `localStorage`.
- Do not remove the `key={sessionId}` remount pattern around `GameShell`. Replay depends on a fresh component tree.
- Do not force `WorldGlobe` to SSR or inline the GeoJSON fetch. The globe is client-only and the polygon loader is promise-cached.

## Load-Bearing Files — Do Not Refactor Without Full Understanding
- `components/game/GameShell.tsx` - Owns the entire round lifecycle, including timers, solved-state UI, globe highlights, and replay reset behavior.
- `lib/game/guess.ts` - Contains duplicate detection, guess resolution, record creation, and display sorting.
- `lib/game/state.ts` - Defines the source of truth for creating and mutating round state.
- `lib/geo/border-distance.ts` - Computes border-aware country distance, caches results, and falls back to centroid distance.
- `lib/geo/world-polygons.ts` - Loads GeoJSON at runtime, matches polygons to countries, and silently falls back when the asset load fails.
- `lib/data/index.ts` - Merges country seeds and centroids, builds the lookup maps, and throws on missing seed data.
- `lib/data/country-match.ts` - Implements the typo-tolerant matching thresholds that make the country input feel forgiving.
- `lib/settings/game-settings.ts` - Owns persisted settings, theme bootstrap behavior, and input assist attributes.
- `components/globe/WorldGlobe.tsx` - Client-only dynamic import, globe textures, highlight mapping, and camera focus all live here.
- `data/items.json` - Tests and round selection depend on stable item IDs and origin codes.

## Confidence Notes
- Build & Deploy Pipeline: High. I found all repo-local scripts and confirmed there are no Makefiles, Dockerfiles, or workflow files. The only uncertain part is the external deployment platform, which is mentioned in the README but not encoded in the repo.
- Database & Models: High. There is no database, ORM, migration tooling, or SQL in this repository; the only data layer is local JSON plus in-memory caches.
- State Management & Data Flow: High. The app uses React state, memoization, module caches, and `localStorage` only; there is no server state library or real-time channel to infer.
