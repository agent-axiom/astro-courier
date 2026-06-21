# Astro Courier

![Astro Courier cover](apps/game-web/public/images/astro-courier-cover.png)

Astro Courier is a cozy-but-chaotic browser space-delivery arcade game. Pilot a tiny courier ship, pick up strange cargo, manage fuel, dodge hazards and interceptors, boost through risky routes, dock cleanly, and chase a better delivery on the next run.

Playable build: https://agent-axiom.github.io/astro-courier/

## What I made

Astro Courier is a TypeScript web game built around short, replayable delivery runs. The player launches a route, collects cargo, reaches the destination pad, and tries to improve speed, fuel discipline, cargo safety, landing quality, and style rewards.

The game includes contracts, route mastery, medals, best-run tracking, optional Cloud Code progress restore, longhaul routes with fuel stops, richer procedural space art, compact mobile menus, replay-style run feedback, daily dispatch progression, cargo risk, hazard pressure, armored combat interceptors, sentinel-class enemies, ship HP, limited homing missiles, adaptive game feel, keyboard/gamepad controls, and touch-friendly browser play.

The project is organized as a pnpm monorepo with separate apps and packages for the web game, simulation, renderer, content, shared types, API, and the optional enemy director Worker.

## How to play

Open the playable link, press `Launch`, pick up the cargo, and dock at the destination pad. Better runs come from faster routes, cleaner landings, less cargo damage, smarter fuel use, combat control, and riskier flight paths that still stay under control.

Some routes are longhaul contracts. Watch for the small `Fuel` chip, dock softly at the relay station, refill, then continue to the far destination.

Keyboard controls:

- `Enter` / `Space`: launch from the preflight screen
- `W` / `ArrowUp`: thrust
- `A` / `ArrowLeft` and `D` / `ArrowRight`: steer
- `S` / `ArrowDown` / `Shift`: brake
- `E`: boost
- `Space` / `J` / `Enter`: fire in flight
- `K`: homing missile
- `P` / `Esc`: pause
- `R`: restart from result screen

The game also supports gamepad input and a large touch steering pad on mobile browsers. On phones, the action dock exposes brake, boost, fire, and remaining missile charges.

## How Codex helped

Codex helped turn Astro Courier from a rough idea into a complete playable browser game. It assisted with the TypeScript monorepo structure, modular game/simulation/content architecture, combat systems, contract and scoring logic, HUD and route feedback, best-run tracking, daily dispatch progression, tests, deployment workflow, and the optional OpenAI-powered Enemy Director integration.

I used Codex as an implementation partner for iterative gameplay feel, UI clarity, architecture, browser deployment, and production-readiness checks rather than only for isolated code snippets.

## Run locally

```sh
corepack pnpm --filter @astro-courier/game-web dev
```

## Publish

The production game is deployed with GitHub Pages from `.github/workflows/deploy-pages.yml`. After the workflow is enabled and `main` is pushed, the public URL is:

https://agent-axiom.github.io/astro-courier/

## Enemy Director Worker

The optional OpenAI enemy director runs as a Cloudflare Worker from `apps/enemy-director-worker`. It keeps the OpenAI API key server-side and returns bounded combat policy plus formation/missile directives to the static GitHub Pages build.

Deploy it with Wrangler:

```sh
corepack pnpm dlx wrangler login
corepack pnpm dlx wrangler deploy --config apps/enemy-director-worker/wrangler.toml
corepack pnpm dlx wrangler secret put OPENAI_API_KEY --config apps/enemy-director-worker/wrangler.toml
```

After deploy, verify:

```sh
curl https://astro-courier-enemy-director.<your-subdomain>.workers.dev/health
```

Then set the GitHub repository variable `VITE_ENEMY_DIRECTOR_URL` to:

```text
https://astro-courier-enemy-director.<your-subdomain>.workers.dev/enemy-director
```

Optional: set `VITE_ENEMY_DIRECTOR_QUALITY=cinematic` to let the Worker send a wider enemy snapshot and a larger OpenAI response budget for richer combat direction.

## Optional Cloud Save

The same Worker can also issue guest profile sessions and store progress snapshots in Cloudflare D1. This is a lightweight Cloud Code save profile, not a GitHub/OAuth account login. Press `Cloud save` in the menu to get a short code, then enter that code on another device with `Restore` to continue progress.

Create the database, copy its `database_id` into `apps/enemy-director-worker/wrangler.toml`, run the migrations, and set a token secret:

```sh
corepack pnpm dlx wrangler d1 create astro-courier-profile
corepack pnpm dlx wrangler d1 execute astro-courier-profile --remote --file apps/enemy-director-worker/migrations/0001_player_progress.sql
corepack pnpm dlx wrangler d1 execute astro-courier-profile --remote --file apps/enemy-director-worker/migrations/0002_cloud_code.sql
corepack pnpm dlx wrangler secret put PROFILE_TOKEN_SECRET --config apps/enemy-director-worker/wrangler.toml
```

Then set `VITE_PROFILE_API_URL` to the Worker base URL, for example:

```text
https://astro-courier-enemy-director.<your-subdomain>.workers.dev
```
