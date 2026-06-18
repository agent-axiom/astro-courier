# Wow Run V1 Design

## Goal

Astro Courier should feel more instantly exciting without becoming text-heavy. Wow Run V1 adds compact pre-run perks, visible risk gates, stronger arcade feedback, and mini-goal readouts that reinforce the "one more delivery" loop.

## Product Shape

The player still wins by picking up cargo and docking cleanly. The new layer adds optional expressive choices:

- Pick one courier perk before launch.
- Fly through glowing risk gates for style rewards.
- Use combat, boost, and clean docking as readable mini-goals.
- See success through visual bursts and short labels rather than long reports.

The first implementation keeps the scope narrow: four perks, one to two risk gates per route, compact preflight cards, compact live/result readouts, and renderer helper effects that reuse the existing Pixi layers.

## Mechanics

Perks:

- `Afterburner`: boost impulse is stronger, but boost costs more fuel.
- `Shield Crate`: ship starts with more HP and emergency shield rebound damages cargo less.
- `Pulse Shot`: the first player shot is larger and hits harder.
- `Magnet Clamp`: pickup capture is more forgiving and rewards smoother starts.

Risk gates:

- Generated from hazard and route geometry.
- Rendered as optional glowing gates near risky route space.
- Cleared once when the ship passes through at speed with cargo still recoverable.
- Awards style and briefly appears as the run milestone.

Mini-goals:

- Preflight exposes three short goals: clear a risk gate, down an interceptor, dock cleanly.
- Live HUD can surface risk-gate progress as a tiny chip when relevant.
- Result overlay stays compact, but can use a single celebratory label from the last meaningful milestone.

## Architecture

Simulation owns perks and risk gate state so scoring, snapshots, replays, and tests stay deterministic. `WorldCreationOptions` receives a selected perk. `SimulationSnapshot` publishes `activePerk` and `riskGates`. `GameShell` owns selected perk UI state while paused, passes it into fresh worlds, and exposes perk/gate status in `HudState`.

Renderer reads risk gates from `SimulationSnapshot` and draws them in the existing guidance/world layer. React preflight renders compact perk cards and mini-goals. No OpenAI or Worker changes are required.

## Failure Handling

If no perk is explicitly chosen, `afterburner` is selected by default for faster first-run feel. Risk gates are optional: missing hazards or unusual route geometry should produce zero gates, not crash world creation. Perks never prevent delivery; they only alter boost, shield, pickup capture, or first shot tuning.

## Testing

Tests cover simulation behavior first: default perk, each perk effect, deterministic risk gate generation, risk gate clearing, and style reward. GameShell tests cover selected perk propagation. Renderer tests cover pure risk gate visual helpers. React/source wiring tests cover perk selector presence and compact result behavior. Full verification remains `corepack pnpm -r test`, `corepack pnpm -r typecheck`, and `DEPLOY_BASE=/astro-courier/ corepack pnpm --filter @astro-courier/game-web build`.
