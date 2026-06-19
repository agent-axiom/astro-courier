# Mobile Flow And Wow Pack Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or continue task-by-task in this thread. Keep the mobile gameplay surface visible at all times.

**Goal:** Make Astro Courier feel light and playable on phones, then start the high-impact "judge wow" work from the producer notes without bloating the HUD.

**Architecture:** Keep simulation unchanged for this slice. Fix mobile control mapping in `input.ts` so the command center matches the visual steering zone. Keep React overlays minimal by default and use CSS mobile media queries for bottom-sheet result/pause cards. Add explicit mobile action buttons that call existing `GameShell.queueCommand`.

**Tech Stack:** TypeScript, Vitest, Vite React, Pixi.js, pnpm monorepo.

## Tasks

### Task 1: Mobile Result And Pause Popups

- [x] Add CSS tests proving mobile result overlays become compact bottom sheets.
- [x] Add CSS tests proving mobile pause overlays hide paragraphs/stats and keep controls thumb-sized.
- [x] Implement mobile-only CSS that hides verbose result details, reduces heights, and avoids full-screen modal coverage.

### Task 2: Mobile Steering Rework

- [x] Add tests showing touch pointer commands use a bottom steering-zone center on phone widths.
- [x] Change `KeyboardInput` pointer center resolution so touch/narrow viewports match `buildTouchPadGeometry`.
- [x] Change the visual touch pad from a huge circle into a low transparent steering zone.

### Task 3: Explicit Mobile Action Dock

- [x] Add wiring tests/source assertions for a mobile-only action dock.
- [x] Render bottom Brake, Boost, and Fire buttons with icons only.
- [x] Make Brake repeat while held; keep Boost and Fire as single tap commands.

### Task 4: Start The Producer Wow Pack

- [x] Use the producer notes as backlog, but only ship changes that reinforce the mobile-light loop now.
- [x] Preserve the strongest next backlog order: Courier License, Perfect Dock, Shareable Report, Ghost clarity, second route, AI radio.
- [x] Do not add long text panels during active flight.

### Task 5: Verification And Release

- [x] Run focused tests for input, touch controls, styles, and result overlay.
- [x] Run full typecheck, tests, and build.
- [x] Browser-check mobile and desktop locally.
- [ ] Commit, push `main`, and watch the GitHub Pages workflow.
