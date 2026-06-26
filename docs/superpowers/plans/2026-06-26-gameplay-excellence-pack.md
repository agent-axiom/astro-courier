# Gameplay Excellence Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add seven compact gameplay-depth slices to Astro Courier and document a concrete 100-iteration roadmap for future polish.

**Architecture:** Keep the existing helper-first approach: small `apps/game-web/src/game/*` presentation helpers, bounded content/schema fields, optional Worker/API extensions, and compact preflight/live UI chips. Avoid new modal-heavy systems and avoid unbounded AI output.

**Tech Stack:** TypeScript, React/Vite, Vitest, pnpm monorepo, Cloudflare Worker, existing simulation/content/shared packages.

---

### Task 1: Mission Hooks

**Files:**
- Modify: `packages/content/src/index.ts`
- Modify: `packages/simulation/src/index.ts`
- Modify: `packages/content/data/systems/starter-route.json`
- Create: `apps/game-web/src/game/missionHook.ts`
- Test: `apps/game-web/src/game/missionHook.test.ts`

- [x] Add bounded mission hook metadata for smuggler, evac, multi-drop, rival, and portal-style contracts.
- [x] Add at least three contracts using hooks.
- [x] Add compact preflight presentation helper.

### Task 2: Combat Readability

**Files:**
- Create: `apps/game-web/src/game/combatReadability.ts`
- Test: `apps/game-web/src/game/combatReadability.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/styles.css`

- [x] Add one compact combat readout that prioritizes missile locks, shield cracks, armor break, and spacing.
- [x] Wire it into live HUD without long text.

### Task 3: Ship Builds

**Files:**
- Create: `apps/game-web/src/game/shipBuild.ts`
- Test: `apps/game-web/src/game/shipBuild.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/styles.css`

- [x] Add build identity from active perk and unlocked ship upgrades.
- [x] Render one compact preflight build chip.

### Task 4: Space Phenomena

**Files:**
- Modify: `packages/content/src/index.ts`
- Modify: `packages/simulation/src/index.ts`
- Create: `apps/game-web/src/game/spacePhenomena.ts`
- Test: `apps/game-web/src/game/spacePhenomena.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/styles.css`

- [x] Add bounded phenomenon hazard types.
- [x] Present route phenomena as puzzle-like hints.

### Task 5: AI Run Director

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/simulation/src/index.ts`
- Modify: `apps/enemy-director-worker/src/index.ts`
- Test: `apps/enemy-director-worker/src/index.test.ts`

- [x] Extend AI directive with bounded run beats.
- [x] Default old responses safely.
- [x] Keep Worker schema strict.

### Task 6: Leaderboard / Ghost Racing Slice

**Files:**
- Modify: `apps/enemy-director-worker/src/index.ts`
- Test: `apps/enemy-director-worker/src/index.test.ts`
- Create: `apps/enemy-director-worker/migrations/0003_leaderboard_entries.sql`
- Create: `apps/game-web/src/game/leaderboard.ts`
- Test: `apps/game-web/src/game/leaderboard.test.ts`

- [x] Add Worker leaderboard submit/top endpoints backed by D1.
- [x] Add compact client-side leaderboard presentation helper.

### Task 7: First Experience

**Files:**
- Modify: `apps/game-web/src/game/firstRunExperience.ts`
- Test: `apps/game-web/src/game/firstRunExperience.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/styles.css`

- [x] Add compact first-session lesson helper.
- [x] Render a short optional preflight cue for first flight / first threat.

### Task 8: 100-Iteration Roadmap

**Files:**
- Create: `docs/gameplay-100-iteration-roadmap.md`
- Modify: `README.md`

- [x] Document 100 future iterations grouped by onboarding, missions, combat, ship builds, physics, AI, social, UX, content, and production.
- [x] Keep README concise.

### Final Verification

- [x] `corepack pnpm --filter @astro-courier/content validate`
- [x] `corepack pnpm --filter @astro-courier/enemy-director-worker test`
- [x] `corepack pnpm --filter @astro-courier/game-web test -- apps/game-web/src/game/missionHook.test.ts apps/game-web/src/game/combatReadability.test.ts apps/game-web/src/game/shipBuild.test.ts apps/game-web/src/game/spacePhenomena.test.ts apps/game-web/src/game/leaderboard.test.ts apps/game-web/src/game/firstRunExperience.test.ts`
- [x] `corepack pnpm -r typecheck`
- [x] `corepack pnpm -r test`
- [x] `corepack pnpm -r build`
- [x] `git diff --check`
- [ ] Commit and push.
