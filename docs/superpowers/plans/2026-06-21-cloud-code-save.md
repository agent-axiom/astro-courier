# Cloud Code Save Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make optional cloud save understandable and useful across devices through a short restore code.

**Architecture:** Keep GitHub Pages static. Extend the existing Cloudflare Worker profile API with a `cloudCode` assigned to each guest profile and a restore endpoint that exchanges the code for a signed session plus progress snapshot. The game stores the cloud session/code in localStorage, displays save status/code in the menu, and lets a player restore progress by entering the code on another device.

**Tech Stack:** TypeScript, React/Vite game UI, Cloudflare Worker, Cloudflare D1, Vitest.

---

### Task 1: Worker Cloud Code API

**Files:**
- Modify: `apps/enemy-director-worker/src/index.ts`
- Modify: `apps/enemy-director-worker/src/index.test.ts`
- Create: `apps/enemy-director-worker/migrations/0002_cloud_code.sql`

- [x] Add failing Worker tests for `cloudCode` in `POST /profile/session` and `POST /profile/restore`.
- [x] Add D1 migration columns `cloud_code` and `display_name`, plus a unique cloud-code index.
- [x] Generate readable codes like `AC-ABCD-2345`, store them with the profile row, and return them in session responses.
- [x] Implement restore by code so another device receives a signed guest token and the saved progress snapshot.

### Task 2: Frontend Cloud Save Helpers

**Files:**
- Modify: `apps/game-web/src/game/cloudSave.ts`
- Modify: `apps/game-web/src/game/cloudSave.test.ts`

- [x] Add `cloudCode` to `CloudSaveSession`.
- [x] Add `restoreSession(cloudCode)` to the cloud client.
- [x] Add helpers to persist/parse the cloud session locally.
- [x] Add helpers to serialize restored best runs back into localStorage.

### Task 3: Menu UI and Restore Flow

**Files:**
- Modify: `apps/game-web/src/App.tsx`
- Modify: `apps/game-web/src/game/preflightOverlayWiring.test.ts`
- Modify: `apps/game-web/src/styles.css`
- Modify: `apps/game-web/src/styles.test.ts`

- [x] Load a stored cloud session on app start and show a compact cloud code.
- [x] Save progress automatically after delivery when a cloud session exists.
- [x] Add a minimal restore form to the preflight menu.
- [x] After restore, write progress into localStorage and refresh visible best-run/progression state.

### Task 4: Verification and Release

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-06-21-cloud-code-save.md`

- [x] Document Cloud Code as the cross-device restore mechanism.
- [x] Run typecheck, tests, build, Worker deploy, Pages deploy, and browser verification.
