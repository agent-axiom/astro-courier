# Campaign Map, Boss Loop, and Replay Hooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Astro Courier feel more directed and replayable by adding a compact campaign map, clearer boss-loop feedback, stronger loadout identity, AI mission modifiers, better combat feel, optional ghost coaching, and a shareable daily result layer.

**Architecture:** Keep changes inside existing helper-first structure: small `apps/game-web/src/game/*` presentation helpers, content-driven contracts, simulation/shared mechanics, renderer-neutral UI chips, and the existing Cloudflare Worker schema. Avoid a new game mode framework; each task adds a testable slice that can ship independently.

**Tech Stack:** TypeScript, React, Vite, Vitest, pnpm monorepo, Cloudflare Worker, existing Pixi simulation/renderer packages.

---

### Task 1: Campaign Map

**Files:**
- Create: `apps/game-web/src/game/campaignMap.ts`
- Test: `apps/game-web/src/game/campaignMap.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/styles.css`

- [x] Add a `buildCampaignMap()` helper that groups route board contracts into compact sectors: `starter`, `deep-space`, `combat`, `boss`.
- [x] Mark each sector node as `active`, `cleared`, `comet`, `locked`, or `next` from best-run progress.
- [x] Render a small clickable sector strip above the existing route-board stack in preflight.
- [x] Verify helper behavior and App wiring with targeted game-web tests.

### Task 2: Boss Loop

**Files:**
- Create: `apps/game-web/src/game/bossLoop.ts`
- Test: `apps/game-web/src/game/bossLoop.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/styles.css`

- [x] Add boss phase presentation for raid/boss contracts: `Breach`, `Break Guard`, `Plant Beacon`, `Extract`.
- [x] Surface a tiny preflight/live boss chip only on boss/raid missions, with no paragraph text.
- [x] Make `forge-flagship-raid` read as a boss objective through the phase helper.
- [x] Verify helper and App wiring.

### Task 3: Loadout 2.0

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/simulation/src/index.ts`
- Test: `packages/simulation/src/simulation.test.ts`
- Modify: `apps/game-web/src/game/GameShell.ts`
- Test: `apps/game-web/src/game/GameShell.test.ts`

- [x] Add a fifth preflight loadout `missile-rack`.
- [x] Give it a clear mechanic: +2 starting missiles and slightly longer boost cooldown tradeoff.
- [x] Keep existing perk selector UI; no new modal.
- [x] Verify simulation and GameShell HUD behavior.

### Task 4: AI Mission Modifiers

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/game-web/src/game/enemyDirector.ts`
- Test: `apps/game-web/src/game/enemyDirector.test.ts`
- Modify: `apps/enemy-director-worker/src/index.ts`
- Test: `apps/enemy-director-worker/src/index.test.ts`

- [x] Extend AI directive with bounded `modifier`: `none`, `ambush`, `lowFuel`, `heavyEscort`, `meteorBurst`, `quietLane`.
- [x] Keep old Worker responses compatible by defaulting missing modifier to `none`.
- [x] Update Worker schema/prompt so OpenAI can select a modifier without free-form gameplay code.
- [x] Verify client validation and Worker fallback/openai responses.

### Task 5: Combat Feel

**Files:**
- Modify: `packages/simulation/src/index.ts`
- Test: `packages/simulation/src/simulation.test.ts`
- Modify: `apps/game-web/src/game/flightDirector.ts`
- Test: `apps/game-web/src/game/flightDirector.test.ts`

- [x] Make player missiles apply an `armor break` effect: strong impact reduces enemy armor before HP spillover.
- [x] Keep cannon as the readable anti-missile/finisher weapon.
- [x] Add a compact flight-director cue when enemies launch missiles: `Shoot missile`.
- [x] Verify missile armor break and cue behavior.

### Task 6: Optional Ghost Coach

**Files:**
- Create: `apps/game-web/src/game/ghostCoach.ts`
- Test: `apps/game-web/src/game/ghostCoach.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/styles.css`

- [x] Add an optional ghost coach cue for training/first route: `Aim`, `Boost`, `Brake`, `Dock`.
- [x] Keep it off during normal advanced missions and make the cue one compact chip.
- [x] Add a preflight toggle that defaults on only while no best run exists for the first route.
- [x] Verify helper behavior and App wiring.

### Task 7: Daily Share Layer

**Files:**
- Create: `apps/game-web/src/game/dailyShare.ts`
- Test: `apps/game-web/src/game/dailyShare.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `README.md`

- [x] Build a compact daily/share summary from dispatch, status, medal, score, and elapsed time.
- [x] Show it on the result overlay only for daily dispatch runs.
- [x] Keep README concise: add one sentence mentioning campaign map, boss loop, loadouts, AI modifiers, ghost coach, and daily share.
- [x] Verify helper and App wiring.

### Final Verification

- [x] `corepack pnpm --filter @astro-courier/content validate`
- [x] `corepack pnpm -r typecheck`
- [x] `corepack pnpm -r test`
- [x] `corepack pnpm -r build`
- [x] Commit and push to repository.
