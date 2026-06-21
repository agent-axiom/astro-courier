# Mission Combat Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Astro Courier more varied and replayable with sharper mission profiles, richer enemy roles, one new tactical weapon, clearer upgrade momentum, stronger combat feedback, a deeper bounded AI Director contract, and weekly challenge rotation.

**Architecture:** Keep the existing helper-first structure. Add small game-web helper modules for presentation/selection, extend shared/simulation/content types only where gameplay needs new data, and keep all AI output bounded to enums. Avoid heavy menus and long explanatory UI; every new live/preflight element should be a compact chip.

**Tech Stack:** TypeScript, React, Vite, Vitest, pnpm monorepo, Pixi renderer, Cloudflare Worker.

---

### Task 1: Mission Design 2.0

**Files:**
- Create: `apps/game-web/src/game/missionProfile.ts`
- Test: `apps/game-web/src/game/missionProfile.test.ts`
- Test: `apps/game-web/src/game/missionProfileWiring.test.ts`
- Modify: `packages/content/src/index.ts`
- Modify: `packages/content/src/content.test.ts`
- Modify: `packages/content/data/systems/starter-route.json`
- Modify: `packages/simulation/src/index.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/styles.css`

- [x] Add mission types `stealth` and `chase` to content/simulation contract typing.
- [x] Add compact mission profile presentation for maze, relay, stealth, chase, escort, assault, boss, and standard routes.
- [x] Add `silent-courier` and `comet-chase` contracts to the starter route content.
- [x] Render one short mission profile chip in preflight.
- [x] Verify content validation, helper behavior, and App wiring.

### Task 2: Combat 2.0 Enemy Roles

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/content/src/index.ts`
- Modify: `packages/content/src/content.test.ts`
- Modify: `packages/content/data/systems/starter-route.json`
- Modify: `packages/simulation/src/index.ts`
- Test: `packages/simulation/src/simulation.test.ts`
- Modify: `packages/renderer-pixi/src/index.ts`
- Test: `packages/renderer-pixi/src/index.test.ts`
- Modify: `apps/enemy-director-worker/src/index.ts`
- Test: `apps/enemy-director-worker/src/index.test.ts`

- [x] Add enemy archetypes `scout`, `gunship`, `tanker`, `jammer`, and `carrier`.
- [x] Give each archetype distinct simulation stats and spawn counts in `enemyWave`.
- [x] Add the new roles to at least two combat contracts.
- [x] Give renderer visuals distinct scale/color/profile by archetype.
- [x] Verify spawning, stats, renderer visuals, and Worker schema acceptance.

### Task 3: Weapons 2.0

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/simulation/src/index.ts`
- Test: `packages/simulation/src/simulation.test.ts`
- Modify: `apps/game-web/src/game/input.ts`
- Test: `apps/game-web/src/game/input.test.ts`
- Modify: `apps/game-web/src/game/GameShell.ts`
- Test: `apps/game-web/src/game/GameShell.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/game/touchControls.ts`
- Test: `apps/game-web/src/game/touchControls.test.ts`

- [x] Add `EMP` player command.
- [x] Add limited EMP ammo to ship state, HUD, snapshot, keyboard input (`Q`), and mobile action labels.
- [x] Make EMP pulse disable nearby enemy firing/missile cooldown pressure and crack shields.
- [x] Render mobile EMP action next to fire/missile.
- [x] Verify simulation, keyboard, HUD, and touch label behavior.

### Task 4: Ship Upgrade Loop

**Files:**
- Create: `apps/game-web/src/game/upgradeChoice.ts`
- Test: `apps/game-web/src/game/upgradeChoice.test.ts`
- Test: `apps/game-web/src/game/upgradeChoiceWiring.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/styles.css`
- Modify: `packages/simulation/src/index.ts`
- Test: `packages/simulation/src/simulation.test.ts`

- [x] Add compact next-upgrade/active-upgrade choice helper.
- [x] Show the current best active system and next unlock in preflight without opening a new menu.
- [x] Make `forge-core` add one EMP charge so high-tier progress changes combat feel.
- [x] Verify helper, App wiring, and forge-core ammo effect.

### Task 5: Better Game Feel

**Files:**
- Create: `apps/game-web/src/game/combatFeel.ts`
- Test: `apps/game-web/src/game/combatFeel.test.ts`
- Test: `apps/game-web/src/game/combatFeelWiring.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/styles.css`

- [x] Add compact combat feel cue for incoming missiles, EMP ready, low HP, and armor break opportunity.
- [x] Render it only in flight and keep it one chip.
- [x] Add CSS pulse/glow classes tied to cue tone.
- [x] Verify helper and App wiring.

### Task 6: AI Director 2.0

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/simulation/src/index.ts`
- Test: `packages/simulation/src/simulation.test.ts`
- Modify: `apps/game-web/src/game/enemyDirector.ts`
- Test: `apps/game-web/src/game/enemyDirector.test.ts`
- Modify: `apps/enemy-director-worker/src/index.ts`
- Test: `apps/enemy-director-worker/src/index.test.ts`

- [x] Extend bounded AI directive with `scene` and `personality` enums.
- [x] Default old/missing responses to safe values.
- [x] Feed scene/personality into local directive clamping and Worker schema/prompt.
- [x] Verify backward compatibility and schema fallback.

### Task 7: Daily / Weekly Challenges

**Files:**
- Create: `apps/game-web/src/game/weeklyChallenge.ts`
- Test: `apps/game-web/src/game/weeklyChallenge.test.ts`
- Test: `apps/game-web/src/game/weeklyChallengeWiring.test.ts`
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/styles.css`
- Modify: `README.md`

- [x] Add deterministic weekly challenge selection favoring raid/boss/combat routes.
- [x] Render compact weekly challenge button/status beside daily dispatch.
- [x] Keep README concise and mention the new mission/combat/weekly systems.
- [x] Verify helper and App wiring.

### Final Verification

- [x] `corepack pnpm --filter @astro-courier/content validate`
- [x] `corepack pnpm -r typecheck`
- [x] `corepack pnpm -r test`
- [x] `corepack pnpm -r build`
- [x] Commit and push to repository.
