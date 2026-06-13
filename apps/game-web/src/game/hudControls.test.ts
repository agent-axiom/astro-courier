import { describe, expect, it } from "vitest";
import { canUseImpulseControl, type ImpulseControlState } from "./hudControls";

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
