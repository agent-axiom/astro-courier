# Cloud Save Combat Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an MVP slice across the five requested directions: optional cloud profile/save API, visible progression/hangar, upgraded enemy presentation, better combat mission pressure, and README documentation.

**Architecture:** Keep GitHub Pages static and add persistence endpoints to the existing Cloudflare Worker so the same deployed backend can serve OpenAI enemy direction and optional profile sync. The game remains fully playable offline/local-only; cloud sync is opt-in and degrades cleanly when the Worker or D1 binding is absent.

**Tech Stack:** TypeScript, Vite React game UI, Cloudflare Worker, optional Cloudflare D1 binding, existing simulation/content/renderer packages.

---

### Task 1: Optional Cloud Profile API

**Files:**
- Modify: `apps/enemy-director-worker/src/index.ts`
- Modify: `apps/enemy-director-worker/src/index.test.ts`
- Modify: `apps/enemy-director-worker/wrangler.toml`

- [x] Add Worker tests for `POST /profile/session`, `GET /profile/progress`, and `PUT /profile/progress`.
- [x] Implement a signed guest token format and D1-backed progress upsert/read.
- [x] Add D1 binding placeholder to `wrangler.toml` so deployment setup is explicit.

### Task 2: Game Cloud Sync Client and UI

**Files:**
- Create: `apps/game-web/src/game/cloudSave.ts`
- Create: `apps/game-web/src/game/cloudSave.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/styles.css`
- Modify: `apps/game-web/src/styles.test.ts`

- [x] Add client helpers that create a session, push best-run/progress snapshots, and pull cloud snapshots.
- [x] Add a compact optional cloud sync button/status in preflight without blocking play.
- [x] Keep localStorage as the source of truth when the player never opts in.

### Task 3: Progression and Hangar Readout

**Files:**
- Create: `apps/game-web/src/game/hangar.ts`
- Create: `apps/game-web/src/game/hangar.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/styles.css`

- [x] Convert existing route marks/best runs into a courier level and three visible upgrade chips.
- [x] Show a compact hangar strip in preflight.
- [x] Avoid adding a full-screen upgrade menu in this slice.

### Task 4: Enemy Ship Design and Combat Clarity

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/simulation/src/index.ts`
- Modify: `packages/simulation/src/simulation.test.ts`
- Modify: `packages/renderer-pixi/src/index.ts`
- Modify: `packages/renderer-pixi/src/index.test.ts`

- [x] Add one new enemy archetype, `sentinel`, and distinct combat stats.
- [x] Add readable enemy visual traits in snapshots.
- [x] Render enemy archetypes with clearer size/color/silhouette differences.

### Task 5: Mission Content, README, Verification, Push

**Files:**
- Modify: `packages/content/data/systems/starter-route.json`
- Modify: `packages/content/src/content.test.ts`
- Modify: `README.md`

- [x] Add or upgrade one combat-heavy mission using the new `sentinel`.
- [x] Document cloud save, hangar progression, and improved enemies in README.
- [x] Run typecheck, tests, build, diff check, commit, push, and verify GitHub Pages.
