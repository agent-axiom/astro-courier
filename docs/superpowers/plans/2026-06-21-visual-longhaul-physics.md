# Visual Longhaul Physics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Astro Courier with richer procedural space art, more expressive planets/ships/phenomena, long-haul refuel missions, and a more physical Newtonian flight model that remains arcade-readable.

**Architecture:** Keep the current TypeScript/Pixi/content/simulation structure. Add small deterministic visual helpers to `packages/renderer-pixi`, extend content schemas for mission/station roles, and adjust simulation physics behind tested helper functions. Avoid raster asset churn in this pass.

**Tech Stack:** TypeScript, Pixi Graphics, pnpm, Vitest, existing content JSON.

---

## Tasks

- [x] 1. Add procedural art helpers and layer checks for planets, ships, space, and phenomena.
- [x] 2. Render richer layered space and planetary/station silhouettes with existing Pixi Graphics.
- [x] 3. Add long-haul contract metadata, refuel stations, and alternating standard/longhaul mission identity.
- [x] 4. Add station refuel behavior and HUD/readout hooks for fuel stops.
- [x] 5. Replace magic braking with retro-thrust and expose a physical gravity helper with tests.
- [x] 6. Update README, run full verification, commit, push, and verify Pages.
