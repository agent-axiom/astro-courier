# Art Combat HUD AI Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Astro Courier lighter during play, more attractive visually, deeper in combat, and smarter through bounded AI director directives.

**Architecture:** Keep the current monorepo structure. Extend existing Pixi procedural helpers instead of adding raster assets; extend simulation/shared types for difficulty, armor, missiles, and AI directives; keep live HUD text minimal by default; keep Worker AI outputs clamped and optional with local fallback.

**Tech Stack:** TypeScript, Pixi Graphics, Vitest, pnpm, Cloudflare Worker, OpenAI Responses API JSON schema.

---

## Tasks

- [x] 1. Add cartoon-realistic art helper outputs and renderer wiring for planet depth, ship silhouette, enemy armor, projectile trails, and phenomena.
- [x] 2. Add contract difficulty tiers, enemy armor/shields, and harder enemy durability scaling by mission.
- [x] 3. Minimize live flight reporting: suppress radio/run-feed text in active flight and keep only compact instrumental chips.
- [x] 4. Add limited homing missiles for player and enemies, missile ammo in snapshots/HUD, and projectile-vs-missile interception.
- [x] 5. Extend AI director request/response with bounded directives for formation, missile doctrine, pressure level, and optional short hint.
- [x] 6. Update README briefly, run content validation, typecheck, tests, build, browser sanity, commit, push, and verify Pages.

## Verification Commands

- `corepack pnpm --filter @astro-courier/content validate`
- `corepack pnpm -r typecheck`
- `corepack pnpm -r test`
- `corepack pnpm -r build`
