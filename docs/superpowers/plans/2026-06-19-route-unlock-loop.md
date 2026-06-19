# Route Unlock Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or continue task-by-task in this thread. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the next route feel immediately available after a successful delivery without adding heavy UI.

**Architecture:** Keep route content and simulation unchanged. Add a small `routeUnlock` presentation helper that converts the existing route-board target into a compact next-route action. Surface that action in the result overlay and the focused preflight briefing.

**Tech Stack:** TypeScript, Vitest, Vite React, Pixi.js, pnpm monorepo.

---

### Task 1: Route Unlock Helper

**Files:**
- Create: `apps/game-web/src/game/routeUnlock.ts`
- Create: `apps/game-web/src/game/routeUnlock.test.ts`

- [x] Write tests for delivered, crashed, same-route, and non-clear targets.
- [x] Implement `buildRouteUnlockAction`.
- [x] Run focused route unlock tests.

### Task 2: Focused Preflight Target

**Files:**
- Modify: `apps/game-web/src/game/preflightOverlay.ts`
- Modify: `apps/game-web/src/game/preflightOverlay.test.ts`
- Modify: `apps/game-web/src/game/preflightOverlayWiring.test.ts`

- [x] Write tests that focused preflight with one saved route shows the route-board target.
- [x] Keep the full contract selector hidden until rich route history.
- [x] Verify source wiring still gates heavy route-board stacks.

### Task 3: Result Overlay Next Route Action

**Files:**
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/game/resultOverlayWiring.test.ts`
- Modify: `apps/game-web/src/styles.css`
- Modify: `apps/game-web/src/styles.test.ts`

- [x] Write wiring tests for `buildRouteUnlockAction`, `openRouteUnlockTarget`, and `result-button-next-route`.
- [x] Render a compact `Next` action only when the current delivery opens a different uncleared route.
- [x] Keep retry and copy actions intact.

### Task 4: Verification And Release

- [x] Run focused route unlock, preflight, result wiring, and styles tests.
- [x] Run full typecheck, tests, and build.
- [x] Browser-check desktop and mobile locally.
- [ ] Commit, push `main`, and watch the GitHub Pages workflow.
