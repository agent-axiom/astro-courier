import { describe, expect, it } from "vitest";
import { buildCombatReadability } from "./combatReadability";

describe("combat readability", () => {
  it("prioritizes missile lock over other combat hints", () => {
    expect(
      buildCombatReadability({
        status: "flying",
        preflightOpen: false,
        interceptorCount: 4,
        incomingMissileCount: 1,
        empAmmo: 1,
        missileAmmo: 2,
        weaponCooldownSeconds: 0
      })
    ).toEqual({
      label: "Lock",
      value: "Shoot missile",
      tone: "danger"
    });
  });

  it("surfaces shield crack and armor break when combat is active", () => {
    expect(
      buildCombatReadability({
        status: "flying",
        preflightOpen: false,
        interceptorCount: 3,
        incomingMissileCount: 0,
        empAmmo: 1,
        missileAmmo: 2,
        weaponCooldownSeconds: 0
      })
    ).toEqual({
      label: "Shield",
      value: "Q EMP",
      tone: "emp"
    });

    expect(
      buildCombatReadability({
        status: "flying",
        preflightOpen: false,
        interceptorCount: 2,
        incomingMissileCount: 0,
        empAmmo: 0,
        missileAmmo: 1,
        weaponCooldownSeconds: 0
      })
    ).toEqual({
      label: "Armor",
      value: "X missile",
      tone: "opportunity"
    });
  });

  it("stays hidden outside live combat", () => {
    expect(
      buildCombatReadability({
        status: "paused",
        preflightOpen: true,
        interceptorCount: 0,
        incomingMissileCount: 0,
        empAmmo: 0,
        missileAmmo: 0,
        weaponCooldownSeconds: 0
      })
    ).toBeUndefined();
  });
});
