# Astro Courier Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first web-first Astro Courier monorepo slice with deterministic simulation, replay, content validation, Pixi rendering boundaries, React shell UI, and a minimal replay-validation API.

**Architecture:** The implementation follows the supplied architecture with simulation isolated from rendering, UI, backend, and AI concerns. The first slice prioritizes deterministic gameplay core, content-as-data, command replay, and a playable browser canvas over full liveops, editor, accounts, and AI generation.

**Tech Stack:** TypeScript, pnpm workspaces, Vite, React, PixiJS v8, Zustand, Fastify, Zod, Vitest.

---

### Scope

This plan implements a foundation that can run locally and be extended safely:

- `packages/simulation`: pure deterministic world state, gravity, thrust, fuel, docking, scoring.
- `packages/engine`: fixed timestep loop helpers, command buffer, replay serialization, stable checksum.
- `packages/content`: Zod schemas, content loader, starter system JSON.
- `packages/renderer-pixi`: Pixi renderer adapter that consumes simulation snapshots.
- `apps/game-web`: Vite app with React shell and Pixi gameplay canvas.
- `apps/api`: Fastify app with health and replay validation routes.

Out of scope for this first slice:

- Accounts, Postgres, Redis, object storage, payments, admin UI, AI generation, full level editor, production asset pipeline, and Colyseus realtime rooms.

### Task 1: Workspace And Red Tests

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `packages/simulation/src/simulation.test.ts`
- Create: `packages/engine/src/replay.test.ts`
- Create: `packages/content/src/content.test.ts`

- [x] **Step 1: Add monorepo configuration**

Create root package scripts for `build`, `typecheck`, `test`, `dev`, and `content:validate`.

- [x] **Step 2: Write failing simulation tests**

Test deterministic replay, gravity acceleration toward a planet, no NaN physics, and landing threshold behavior.

- [x] **Step 3: Write failing engine tests**

Test command buffering by tick and stable replay checksum.

- [x] **Step 4: Write failing content tests**

Test starter content validation and invalid content rejection.

- [ ] **Step 5: Run tests to verify RED**

Run: `corepack pnpm test`

Expected: tests fail because package implementations do not exist yet.

### Task 2: Deterministic Core

**Files:**
- Create: `packages/shared/src/index.ts`
- Create: `packages/engine/src/index.ts`
- Create: `packages/simulation/src/index.ts`

- [ ] **Step 1: Implement shared command and snapshot types**

Define `PlayerCommand`, `InputFrame`, `Vec2`, `SimulationSnapshot`, and result types without DOM, React, or Pixi dependencies.

- [ ] **Step 2: Implement command buffer and replay checksum**

Add sorted command reads by tick and a deterministic checksum over canonical JSON.

- [ ] **Step 3: Implement simulation world creation**

Create a world from validated content with ship, gravity sources, docking targets, hazards, cargo, and RNG seed.

- [ ] **Step 4: Implement fixed-step simulation**

Apply commands, thrust, gravity, fuel consumption, movement integration, docking checks, crash checks, and score updates.

- [ ] **Step 5: Run package tests**

Run: `corepack pnpm --filter @astro-courier/simulation test` and `corepack pnpm --filter @astro-courier/engine test`.

Expected: all package tests pass.

### Task 3: Content-As-Data

**Files:**
- Create: `packages/content/src/index.ts`
- Create: `packages/content/data/systems/starter-route.json`

- [ ] **Step 1: Implement Zod schemas**

Validate systems, planets, stations, landing pads, contracts, cargo, hazards, and difficulty metadata.

- [ ] **Step 2: Implement starter route data**

Add a single playable route with one planet, one station, one contract, and tuned landing thresholds.

- [ ] **Step 3: Implement validation CLI**

Expose `validateContentBundle()` and a `validate` script for build-time checks.

- [ ] **Step 4: Run content validation**

Run: `corepack pnpm content:validate`

Expected: starter route validates successfully.

### Task 4: Web Game Client

**Files:**
- Create: `apps/game-web/src/main.tsx`
- Create: `apps/game-web/src/App.tsx`
- Create: `apps/game-web/src/game/GameShell.ts`
- Create: `apps/game-web/src/game/input.ts`
- Create: `apps/game-web/src/styles.css`
- Create: `packages/renderer-pixi/src/index.ts`

- [ ] **Step 1: Implement React shell**

Render contract status, fuel, score, landing result, pause/restart controls, and a canvas mount point.

- [ ] **Step 2: Implement Pixi renderer adapter**

Render starfield, gravity rings, planet, station pad, ship, flame, trajectory preview, and route marker from simulation snapshots.

- [ ] **Step 3: Implement input adapters**

Support keyboard thrust/turn/brake/pause commands and pointer aim primitives via command frames.

- [ ] **Step 4: Connect fixed timestep shell**

Run simulation at `1 / 60`, render interpolation snapshots on `requestAnimationFrame`, and avoid React updates per frame except sampled HUD state.

- [ ] **Step 5: Build client**

Run: `corepack pnpm --filter @astro-courier/game-web build`

Expected: Vite production build completes.

### Task 5: Minimal API

**Files:**
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/routes/replays.ts`
- Create: `apps/api/src/routes/health.ts`

- [ ] **Step 1: Implement health route**

Return service name and version.

- [ ] **Step 2: Implement replay validation route**

Accept content id, seed, ship config, command frames, and summary, then re-run deterministic simulation and return accepted/rejected with checksum.

- [ ] **Step 3: Add API smoke test or typecheck**

Run: `corepack pnpm --filter @astro-courier/api typecheck`.

Expected: no TypeScript errors.

### Task 6: Final Verification

**Files:**
- Modify: docs and package scripts as needed.

- [ ] **Step 1: Run full test suite**

Run: `corepack pnpm test`

Expected: all unit tests pass.

- [ ] **Step 2: Run full typecheck**

Run: `corepack pnpm typecheck`

Expected: all workspace packages typecheck.

- [ ] **Step 3: Run full build**

Run: `corepack pnpm build`

Expected: packages, API, and web app build.

