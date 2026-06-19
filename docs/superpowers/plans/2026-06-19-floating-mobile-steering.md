# Floating Mobile Steering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make phone steering feel natural by letting the first thumb contact inside the bottom steering strip become the neutral origin for that drag.

**Architecture:** Add one touch-control helper that resolves a floating origin inside the visible touch pad and falls back to the pad center outside it. Use that helper from the command mapper and from the visual pointer state so gameplay and UI agree.

**Tech Stack:** TypeScript, Vitest, Vite React, Pixi.js, pnpm monorepo.

---

### Task 1: Touch Origin Helper

**Files:**
- Modify: `apps/game-web/src/game/touchControls.ts`
- Modify: `apps/game-web/src/game/touchControls.test.ts`

- [x] Add a failing test where a phone touch inside the steering strip resolves to the touch point.
- [x] Add a failing test where a touch outside the strip falls back to the strip center.
- [x] Implement `resolveTouchSteeringOrigin`.
- [x] Run `corepack pnpm --filter @astro-courier/game-web test -- src/game/touchControls.test.ts`.

### Task 2: Input Mapping Uses Floating Origin

**Files:**
- Modify: `apps/game-web/src/game/input.ts`
- Modify: `apps/game-web/src/game/input.test.ts`

- [x] Add a failing test for `resolvePointerCommandCenter` using the initial phone touch point as origin.
- [x] Add a failing test that off-strip touches still use the safe centered origin.
- [x] Store the pointer-down point in `KeyboardInput` and pass it to `resolvePointerCommandCenter`.
- [x] Run `corepack pnpm --filter @astro-courier/game-web test -- src/game/input.test.ts`.

### Task 3: App Visual Follows Floating Origin

**Files:**
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/game/touchControls.test.ts`

- [x] Add a failing source-wiring test for `touchPointerOriginRef` and `resolveTouchSteeringOrigin`.
- [x] Use the same floating origin helper for the touch stick visual.
- [x] Clear the origin on pointer up/cancel and blur.
- [x] Run focused touch tests.

### Task 4: Verification And Release

- [x] Run `corepack pnpm -r typecheck`.
- [x] Run `corepack pnpm -r test`.
- [x] Run `corepack pnpm -r build`.
- [x] Browser-check desktop and mobile locally.
- [ ] Commit, push `main`, and watch the GitHub Pages workflow.
