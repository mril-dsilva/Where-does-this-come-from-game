# OriginGuessr

**OriginGuessr** is a daily geography game where you guess the country of origin for everyday things: foods, inventions, cultural icons. Each guess lands on a 3D globe with heat-based color feedback (cold to hot) guiding you closer. One item per day. Solve it in as few guesses as possible.

---

## Goals

**Cultural and geographic education.** Most people can name a country on a map; fewer know that blue jeans came from the US, that chess originated in India, or that instant noodles are Japanese. OriginGuessr turns that gap into a game. Each round is a small moment of discovery about where the things around us actually come from.

**Personal development practice.** This project was built to practice building real, polished products; not just tutorials. Along the way it touches skills that matter for any developer growing their craft:

- **Next.js App Router:** server vs. client components, metadata, routing
- **TypeScript:** strict typing, shared types across logic and UI layers
- **React 19:** hooks, memoization, state management without a library
- **Tailwind CSS v4:** utility-first design with CSS variables for theming
- **3D visualization:** `react-globe.gl` and `Three.js` for interactive globe rendering
- **Geo math:** Haversine distance, border sampling, neighboring country logic
- **Fuzzy matching:** Levenshtein distance for typo-tolerant country resolution
- **API integration:** connecting to external databases like Airtable to manage and serve game content dynamically
- **Testing:** Node.js built-in test runner with pure function coverage
- **AI-assisted development:** using AI as a real product iteration tool, not just a code generator

---

## How It Works

A game item (a food, invention, or cultural icon) is shown with an emoji reel. The player types a country name; the app resolves it with fuzzy matching, evaluates proximity using real border-aware geographic distance, and plots the result on the globe in heat colors from cold blue to hot red. Each new guess updates the globe and gives warmer/cooler feedback relative to the previous one. Guess the correct country to solve the round and unlock a fun fact about the item's origin.

---

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- `react-globe.gl`
- `three`
- ESLint + Prettier

### Architecture Notes

The codebase is split so the game stays maintainable and easy to extend:

- `app/` handles routing, metadata, and the root shell.
- `components/game/` contains gameplay UI and round flow.
- `components/globe/` handles globe rendering and legend presentation.
- `components/site/` holds landing-page and settings UI.
- `lib/data/` manages local seed access, country lookup, and matching.
- `lib/game/` contains round logic, guess evaluation, and heat rules.
- `lib/geo/` contains distance, border, and polygon helpers.

That separation keeps presentation thin and leaves a clean path for future backend integration without rewriting the core game logic.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm test` — run tests
- `npm run lint` — lint the codebase
- `npm run typecheck` — TypeScript type check
- `npm run format` — format all files with Prettier
- `npm run format:check` — check formatting without writing
- `npm run build` — production build

## Deployment

This project is ready to deploy on Vercel with the default Next.js build settings. No environment variables are required for the current MVP.
