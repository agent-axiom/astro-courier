# Combat AI Director Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first playable combat layer and Cloudflare Worker scaffold for an OpenAI enemy director.

**Architecture:** Combat state lives in `packages/simulation` and is exposed through `SimulationSnapshot`. The game client renders and controls combat locally, while the Worker provides optional high-level enemy policy that can fail without breaking gameplay.

**Tech Stack:** TypeScript, Vitest, Vite React, Pixi.js, Cloudflare Workers, OpenAI Responses API.

---

## File Structure

- Modify `packages/shared/src/index.ts`: add `FIRE`, combat snapshot types, and director contract types.
- Modify `packages/simulation/src/index.ts`: add combat world state, deterministic enemy AI, projectile stepping, cooldowns, HP, scoring hooks, and snapshots.
- Modify `packages/simulation/src/simulation.test.ts`: add RED/GREEN simulation coverage for combat.
- Modify `apps/game-web/src/game/input.ts` and `apps/game-web/src/game/input.test.ts`: map fire controls.
- Modify `apps/game-web/src/game/GameShell.ts` and tests: expose compact combat HUD and optional director policy injection.
- Modify `packages/renderer-pixi/src/index.ts` and tests: draw upgraded ship, enemies, projectiles, and pure visual specs.
- Add `apps/enemy-director-worker/*`: Cloudflare Worker source, package metadata, TypeScript config, Wrangler config, and tests.
- Modify root `package.json` / workspace files if needed so worker tests and typecheck run with the monorepo.

## Tasks

### Task 1: Combat Types And Simulation Tests

- [ ] Write failing tests in `packages/simulation/src/simulation.test.ts` for initial HP, enemy presence, fire cooldown, player projectile damage, enemy projectile damage, and HP depletion crash.
- [ ] Run `corepack pnpm --filter @astro-courier/simulation test -- src/simulation.test.ts` and confirm the new tests fail because combat fields and `FIRE` are missing.
- [ ] Add `FIRE` and combat snapshot types in `packages/shared/src/index.ts`.
- [ ] Add world combat state in `packages/simulation/src/index.ts`.
- [ ] Run the focused simulation test and confirm it passes.

### Task 2: Local Enemy AI And Projectiles

- [ ] Add deterministic interceptor spawn positions derived from existing system geometry.
- [ ] Implement local enemy AI with patrol, chase, and fire cooldowns.
- [ ] Implement projectile integration, max age cleanup, hit detection, and HP changes.
- [ ] Add focused tests for enemy cooldown stability and projectile cleanup.
- [ ] Run simulation tests.

### Task 3: Input, HUD, And Shell Wiring

- [ ] Write failing input tests for `KeyJ`, `Enter`, and a gamepad face button mapping to `{ type: "FIRE" }`.
- [ ] Implement input mapping and one-shot fire queueing.
- [ ] Add `shipHp`, `shipMaxHp`, `interceptorCount`, and `directorMode` to `HudState`.
- [ ] Publish those fields from `GameShell`.
- [ ] Run game-web focused tests.

### Task 4: Pixi Combat Visuals

- [ ] Write failing renderer helper tests for player ship detail, enemy visual tones, projectile visuals, and HP warning effects.
- [ ] Implement pure visual helpers.
- [ ] Draw upgraded courier ship using layered Pixi geometry.
- [ ] Draw enemies and projectiles from `SimulationSnapshot`.
- [ ] Run renderer tests.

### Task 5: Cloudflare Worker Scaffold

- [ ] Add `apps/enemy-director-worker/package.json`, `src/index.ts`, `src/index.test.ts`, `tsconfig.json`, and `wrangler.toml`.
- [ ] Write failing Worker tests for health check, CORS preflight, request validation, OpenAI call shape, output clamping, and upstream failure.
- [ ] Implement Worker fetch handler.
- [ ] Run Worker tests and typecheck.

### Task 6: Client Director Adapter

- [ ] Add game-web tests for disabled director config and successful policy fetch.
- [ ] Implement a small client adapter that reads `VITE_ENEMY_DIRECTOR_URL`.
- [ ] Poll the Worker at low frequency and pass cached policy to simulation.
- [ ] Keep local AI as fallback when URL is missing or request fails.

### Task 7: Verification And Release

- [ ] Run `corepack pnpm -r test`.
- [ ] Run `corepack pnpm -r typecheck`.
- [ ] Run `DEPLOY_BASE=/astro-courier/ corepack pnpm --filter @astro-courier/game-web build`.
- [ ] Check the local browser at `http://127.0.0.1:5173/` for canvas, controls, combat visuals, no console errors, and no overlapping HUD text.
- [ ] Commit and push to `main`.
