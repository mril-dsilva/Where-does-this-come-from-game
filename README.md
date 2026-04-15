# OriginGuessr by MrillionAI

OriginGuessr is a playful, data-driven geography game that asks players to trace everyday things back to their country of origin. It was built with AI-assisted workflows for both implementation and design iteration, which helped keep the product fast-moving, visually cohesive, and highly polished. The result is a dynamic experience that feels alive as the globe, heat map, hints, and round feedback all respond to each guess in real time.

The project is intentionally dynamic in how it evolves too. I’m currently building the next layer around a `design.md` file to unify the design system and make polished updates easier, along with an agentic research workflow that surfaces the most interesting clues and keeps the gameplay experience sharp.

## What It Is

OriginGuessr is a globe-based guessing game about origin, intuition, and discovery.

Each round presents an item, a clue reel, and a country input. Players guess where the item came from, and the game responds with proximity-based feedback, country highlights, and a short fact once the answer is solved. The experience is intentionally minimal, but it still feels rich because the UI, globe, and game state are all tightly connected.

## How It Works

- A daily-style item is selected from local seed data.
- The player enters a country name, code, alias, or near-match.
- The app resolves the guess, handles duplicates, and evaluates proximity.
- Country feedback is based on geo distance and border-aware logic.
- The globe, heat states, and solved-state UI update immediately after each guess.
- When the round is solved, the game reveals the answer, shows a fact, and resets cleanly for the next session.

The game is dynamic by design:

- The globe reacts to gameplay state.
- Heat colors change based on actual country distance.
- Assist mode adapts the input experience.
- Light and dark mode are fully supported.
- The whole round flow is stateful, responsive, and replayable.

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- `react-globe.gl`
- `three`
- ESLint

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

## What I Learned

- How to keep UI, game logic, and geo logic separated without overengineering the project.
- How to build a polished product experience from local seed data while keeping the system ready for future APIs or databases.
- How to use AI workflows as a real product-development tool for rapid iteration, refinement, and design exploration.
- How much small details matter in a game like this, especially around feedback, pacing, state transitions, and visual hierarchy.
- How to make a game feel dynamic and modern without relying on heavy dependencies or unnecessary complexity.

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

## Testing

- `npm test`
- `npm run lint`
- `npm run build`

## Deployment

This project is ready to deploy on Vercel with the default Next.js build settings.

No environment variables are required for the current MVP.

## Project Goal

The goal of OriginGuessr is to present a portfolio-ready game that feels polished, dynamic, and thoughtfully engineered while still being easy to evolve into a richer product later.
