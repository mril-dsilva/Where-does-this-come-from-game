# OriginGuessr by MrillionAI

OriginGuessr is a polished geography guessing game with a two-state experience: a cinematic landing page and a focused gameplay page. The player sees an item and emoji hint, then guesses the country of origin. Correct answers solve the round, reveal a fact, and light up the globe.

## MVP Features
- Landing page and gameplay page with a shared brand system
- Item-based geography guessing with foods, inventions, and brands
- Typo-tolerant country input with aliases and suggestions
- Spinnable, zoomable 3D globe with visible borders
- Heat-colored guessed countries based on distance from the answer
- Success state with brief confetti, origin fact, and round reset
- Minimal, portfolio-friendly presentation with a premium dark UI

## Tech Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- `react-globe.gl` for the 3D globe

## Architecture
The app is organized so the UI can stay thin while the data and rules remain reusable:

- `app/` handles the page shell and metadata
- `components/game/` contains the game UI and round state
- `components/globe/` contains globe rendering and legend UI only
- `lib/data/` holds seed access and country matching helpers
- `lib/game/` holds round logic, guess evaluation, and heat rules
- `lib/geo/` holds distance and polygon helpers
- `data/` contains the local MVP seed content

That split keeps the project easy to maintain now and gives us a clean path to Postgres/Neon later without rewriting the whole app.

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

## Deployment to Vercel
1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. Leave the default build settings in place:
   - Framework preset: Next.js
   - Build command: `next build`
   - Output: managed by Vercel automatically
4. Deploy.

This project does not require environment variables for the current MVP.

## Tradeoffs
- The data layer uses local JSON for fast iteration and easy review.
- Country polygons are vendored in `public/geo/` and loaded through a focused geo helper so the globe stays deployment-friendly.
- The globe prioritizes stability and readability over advanced map effects for the first version.
- Confetti is intentionally brief and restrained to keep the experience polished rather than noisy.

## Future Improvements
- Swap local JSON for Postgres/Neon-backed content
- Add daily challenge support
- Add leaderboards and user accounts
- Add saved stats and session history
- Add admin-managed item and country content
- Improve globe interaction polish once the core game is fully validated

## Project Goal
This project is designed to be portfolio-ready: clear structure, reusable logic, and a polished first impression without unnecessary complexity.
