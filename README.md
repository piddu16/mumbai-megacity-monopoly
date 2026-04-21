# Mumbai Megacity Monopoly

> *Sab kuch milega. Guarantee nahi.*

An online multiplayer (2–6 players) real-estate board game set across real Mumbai geography. Real builders, real areas, 6 transport modes, 5 governance roles, Teen Patti standoffs, side deals, and always-on chat.

## Stack
- **Next.js 14** (App Router, TypeScript, Tailwind)
- **Supabase** (Postgres + Realtime for multiplayer sync)
- **Vercel** (deploy)

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` → `.env.local` and fill in your Supabase URL + anon key.

## Database

Run `supabase/migrations/001_mm_schema.sql` against your Supabase project. All tables are prefixed `mm_` to avoid conflicts with anything else in that project.

## Architecture

- `src/lib/game-engine.ts` — Pure reducer. All game logic. No side effects.
- `src/lib/tiles.ts` — 43 Mumbai tiles.
- `src/lib/roles.ts` — 5 governance roles + powers.
- `src/lib/cards.ts` — Chance + Community deck.
- `src/lib/transport.ts` — 6 transport modes.
- `src/lib/teen-patti.ts` — 3-card standoff engine.
- `src/hooks/useGameSync.ts` — Supabase realtime subscription.
- `src/components/*` — UI.

## How multiplayer works

1. Host creates room → 6-char code is generated.
2. Players join by entering the code.
3. Host picks a win condition and clicks Start → initial `game_state` is written to `mm_rooms.game_state` (JSONB).
4. All clients subscribe to `mm_rooms` via Supabase Realtime `postgres_changes`.
5. Only the current player can dispatch actions. Reducer runs locally, writes the new state. Others see the update via realtime.
6. Chat + side deals flow through the same game state (atomic with the board).

Built for playing with friends over video call.
