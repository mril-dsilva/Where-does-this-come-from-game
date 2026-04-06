# Agents Guide

- Keep game logic, geo logic, and data access separated under `lib/game`, `lib/geo`, and `lib/data`.
- Do not import raw JSON directly from UI components; go through helpers in `lib/data`.
- Preserve the clean, minimal visual style and avoid adding new dependencies unless they are required.
- Keep changes phase-based and leave future backend integration points isolated from presentation code.
- Prefer small, readable components and pure helpers over clever abstractions.
- When changing a round flow, keep the success state, reset behavior, and globe highlights aligned.
