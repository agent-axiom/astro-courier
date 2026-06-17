# Combat And OpenAI Enemy Director Design

## Goal

Astro Courier keeps its light delivery loop, but adds a compact arcade combat layer: a nicer courier ship, hostile interceptors, player firing, enemy firing, and ship HP. GitHub Pages remains the static game host. Cloudflare Worker hosts the OpenAI-backed enemy director and keeps `OPENAI_API_KEY` out of the browser.

## Product Shape

Combat must support the delivery objective rather than replace it. The player still wins by pickup and delivery, while interceptors add pressure, movement variety, and optional style scoring. The first implementation is intentionally small: one or two interceptors per run, visible shots, clear HP, and minimal HUD text. If the director is unavailable, the game remains playable with deterministic local AI.

## Architecture

The simulation owns combat state because replay, scoring, renderer snapshots, and tests all already flow through `stepWorld()` and `snapshotWorld()`. `PlayerCommand` gains `FIRE`; `SimulationWorld` gains ship HP, player projectiles, enemy projectiles, and enemy ships. Local AI runs every tick and consumes optional director policy values. Rendering reads combat from `SimulationSnapshot`; React HUD only displays a compact HP and interceptor status.

The Cloudflare Worker exposes a small JSON endpoint, `POST /enemy-director`. The frontend sends a reduced, non-secret game state every few seconds, never per frame. The Worker validates the request, calls OpenAI Responses API with structured JSON output, clamps the result, and returns a director policy such as aggression, target bias, flank direction, and retreat threshold. The OpenAI API key is stored only as a Cloudflare secret.

## Data Flow

1. Input maps keyboard/gamepad fire intent to `{ type: "FIRE" }`.
2. `GameShell` records the command in replay frames and passes it to `stepWorld()`.
3. Simulation updates cooldowns, projectiles, enemies, projectile collisions, HP, and existing delivery physics.
4. `snapshotWorld()` publishes combat arrays and health values.
5. Pixi draws ship detail, enemies, lasers, hit flashes, and HP-sensitive effects.
6. React shows compact combat HUD state.
7. Optional client director polls Worker and passes policy into the next simulation ticks.

## Failure Handling

OpenAI/Worker failure cannot break a run. The frontend keeps a local policy cache and falls back to deterministic local AI on timeout, invalid JSON, non-2xx responses, or missing endpoint config. The Worker returns CORS headers for GitHub Pages, rejects non-POST director requests, validates numeric ranges, and clamps model output before sending it back.

## Security

The OpenAI API key is never shipped to Vite, GitHub Pages, localStorage, or source files. Worker secrets are configured out-of-band with Wrangler. The game only stores the public director URL. The Worker sends only reduced game state to OpenAI: positions, velocities, HP, route phase, and enemy summaries; no user data or replay history.

## Testing

Tests cover simulation behavior first: enemy spawning, fire cooldowns, projectile hits, HP loss, and player crash on HP depletion. Input tests cover keyboard/gamepad fire. Renderer tests cover pure visual helpers for enemy and projectile draw specs. Worker tests cover CORS, schema validation, OpenAI request shape, and fallback-safe error responses. Full verification remains `pnpm -r test`, `pnpm -r typecheck`, and Pages build with `DEPLOY_BASE=/astro-courier/`.
