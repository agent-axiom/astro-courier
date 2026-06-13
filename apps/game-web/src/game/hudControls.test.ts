import { describe, expect, it } from "vitest";
import { buildBoostControlPresentation, canUseImpulseControl, type ImpulseControlState } from "./hudControls";

describe("HUD impulse controls", () => {
  it("allows boost and brake only during active runs with enough fuel", () => {
    const cases: Array<[ImpulseControlState, boolean]> = [
      [{ action: "boost", fuel: 100, paused: false, preflightOpen: false, status: "flying" }, true],
      [{ action: "brake", fuel: 1, paused: false, preflightOpen: false, status: "flying" }, true],
      [{ action: "boost", fuel: 2, paused: false, preflightOpen: false, status: "flying" }, false],
      [{ action: "boost", fuel: 100, boostCooldownSeconds: 0.4, paused: false, preflightOpen: false, status: "flying" }, false],
      [{ action: "brake", fuel: 0, paused: false, preflightOpen: false, status: "flying" }, false],
      [{ action: "brake", fuel: 100, paused: true, preflightOpen: false, status: "paused" }, false],
      [{ action: "brake", fuel: 100, paused: false, preflightOpen: true, status: "flying" }, false],
      [{ action: "brake", fuel: 100, paused: false, preflightOpen: false, status: "delivered" }, false]
    ];

    for (const [state, expected] of cases) {
      expect(canUseImpulseControl(state)).toBe(expected);
    }
  });
});

describe("boost control presentation", () => {
  it("formats ready, cooldown, and disabled button states", () => {
    expect(buildBoostControlPresentation({ canBoost: true, boostCooldownSeconds: 0 })).toEqual({
      label: "Boost",
      tone: "ready",
      cooldownProgress: 0
    });
    expect(buildBoostControlPresentation({ canBoost: false, boostCooldownSeconds: 0.4 })).toMatchObject({
      label: "Boost 0.4s",
      tone: "cooldown"
    });
    expect(buildBoostControlPresentation({ canBoost: false, boostCooldownSeconds: 0 })).toEqual({
      label: "Boost",
      tone: "disabled",
      cooldownProgress: 0
    });
  });

  it("normalizes cooldown progress for a radial button treatment", () => {
    const presentation = buildBoostControlPresentation({ canBoost: false, boostCooldownSeconds: 0.58 });

    expect(presentation.cooldownProgress).toBeGreaterThan(0);
    expect(presentation.cooldownProgress).toBeLessThan(1);
  });
});
