import { describe, expect, it } from "vitest";
import { buildCombatFeelCue } from "./combatFeel";

describe("combat feel cue", () => {
  it("prioritizes incoming missile danger", () => {
    expect(
      buildCombatFeelCue({
        status: "flying",
        preflightOpen: false,
        incomingMissileCount: 2,
        empAmmo: 1,
        shipHp: 90,
        shipMaxHp: 100,
        interceptorCount: 3,
        missileAmmo: 2
      })
    ).toEqual({
      label: "Incoming",
      value: "Shoot missile",
      tone: "danger"
    });
  });

  it("surfaces EMP readiness before generic combat pressure", () => {
    expect(
      buildCombatFeelCue({
        status: "flying",
        preflightOpen: false,
        incomingMissileCount: 0,
        empAmmo: 1,
        shipHp: 90,
        shipMaxHp: 100,
        interceptorCount: 2,
        missileAmmo: 0
      })
    ).toEqual({
      label: "EMP ready",
      value: "Crack shields",
      tone: "emp"
    });
  });

  it("stays hidden outside active combat flight", () => {
    expect(
      buildCombatFeelCue({
        status: "paused",
        preflightOpen: true,
        incomingMissileCount: 0,
        empAmmo: 0,
        shipHp: 100,
        shipMaxHp: 100,
        interceptorCount: 0,
        missileAmmo: 0
      })
    ).toBeUndefined();
  });
});
