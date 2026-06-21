# Gameplay Clarity, Combat, and Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make Astro Courier easier to understand on the first run, less punishing by default, deeper in combat/progression, and richer in missions and visuals.

**Architecture:** Build on existing focused helper modules instead of adding a new gameplay framework. Use content JSON for new missions, simulation/shared types for combat and upgrades, renderer helpers for visual polish, GameShell for state bridging, and the Cloudflare Worker for higher-level AI direction.

**Tech Stack:** TypeScript, React, Vite, Pixi renderer helpers, Vitest, pnpm monorepo, Cloudflare Worker.

---

### Task 1: Arcade Clarity Pack

**Files:**
- Modify: `apps/game-web/src/game/flightDirector.ts`
- Modify: `apps/game-web/src/App.tsx`
- Test: `apps/game-web/src/game/flightDirector.test.ts`

- [x] Add compact preflight and combat cues: `Enter / Space launch`, `Space fire`, `X missile`.
- [x] Pass `interceptorCount`, `weaponCooldownSeconds`, and `missileAmmo` into the flight director.
- [x] Verify with targeted game-web tests.

### Task 2: Difficulty Director

**Files:**
- Modify: `packages/simulation/src/index.ts`
- Test: `packages/simulation/src/simulation.test.ts`

- [x] Make non-combat contracts stay non-combat unless `enemyWave` is explicitly present.
- [x] Reduce early/hard combat pressure: softer standard/hard armor, fewer hard enemy missiles, slower first missile cooldown.
- [x] Verify with simulation tests.

### Task 3: Combat v2 Enemy Roles

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/content/src/index.ts`
- Modify: `packages/simulation/src/index.ts`
- Modify: `packages/renderer-pixi/src/index.ts`
- Test: `packages/content/src/content.test.ts`
- Test: `packages/simulation/src/simulation.test.ts`
- Test: `packages/renderer-pixi/src/index.test.ts`

- [x] Add `guardian` and `missileBoat` enemy archetypes with distinct armor, shields, missiles, speed, and silhouettes.
- [x] Extend `enemyWave` schema to allow `guardians` and `missileBoats`.
- [x] Verify role snapshots and renderer visuals.

### Task 4: Mission Variety

**Files:**
- Modify: `packages/content/src/index.ts`
- Modify: `packages/simulation/src/index.ts`
- Modify: `packages/content/data/systems/starter-route.json`
- Test: `packages/content/src/content.test.ts`

- [x] Extend mission type metadata with `rescue`, `escort`, and `raid`.
- [x] Add concise new contracts: rescue pod run, convoy escort, and forge flagship raid.
- [x] Keep README concise and move long mechanics out if needed.

### Task 5: Upgrade Loop Becomes Mechanical

**Files:**
- Modify: `packages/simulation/src/index.ts`
- Modify: `apps/game-web/src/game/GameShell.ts`
- Modify: `apps/game-web/src/App.tsx`
- Test: `packages/simulation/src/simulation.test.ts`
- Test: `apps/game-web/src/game/GameShell.test.ts`

- [x] Add `shipUpgrades` world creation option.
- [x] Apply unlocked upgrades: reinforced hull adds HP, pulse rail arms pulse shot, mag clamp widens pickup, forge core adds missile ammo.
- [x] Add `GameShell.setShipUpgrades()` and call it from App when route marks unlock upgrades.

### Task 6: Visual Polish

**Files:**
- Modify: `packages/renderer-pixi/src/index.ts`
- Test: `packages/renderer-pixi/src/index.test.ts`

- [x] Improve planet/cartoon-real visuals with richer material bands and atmospheric accents.
- [x] Improve cosmic phenomena visuals with more readable severity, pulse, and accent colors.
- [x] Render new enemy roles with distinct silhouettes.

### Task 7: AI Director 2.0

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/simulation/src/index.ts`
- Modify: `apps/game-web/src/game/enemyDirector.ts`
- Modify: `apps/game-web/src/game/GameShell.ts`
- Modify: `apps/enemy-director-worker/src/index.ts`
- Test: `apps/game-web/src/game/enemyDirector.test.ts`
- Test: `apps/game-web/src/game/GameShell.test.ts`
- Test: `apps/enemy-director-worker/src/index.test.ts`

- [x] Extend director directives with `tempo`: `calm`, `push`, `spike`.
- [x] Let simulation use tempo to modulate enemy pressure and missile policy.
- [x] Update Worker schema/prompt and client validation.

### Final Verification

- [x] `corepack pnpm --filter @astro-courier/content validate`
- [x] `corepack pnpm -r typecheck`
- [x] `corepack pnpm -r test`
- [x] `corepack pnpm -r build`
- [ ] Push to `main` and verify GitHub Pages deploy.
- [ ] Deploy Worker if Worker code changes and verify `/health` plus `/enemy-director`.
