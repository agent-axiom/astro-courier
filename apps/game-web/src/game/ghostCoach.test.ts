import { describe, expect, it } from "vitest";
import { buildGhostCoachCue } from "./ghostCoach";

describe("ghost coach", () => {
  it("stays off when disabled or the route is no longer eligible", () => {
    expect(
      buildGhostCoachCue({
        enabled: false,
        eligible: true,
        status: "flying",
        objectivePhase: "pickup",
        cargoOnboard: false,
        targetDistance: 180,
        speed: 0
      })
    ).toBeUndefined();
    expect(
      buildGhostCoachCue({
        enabled: true,
        eligible: false,
        status: "flying",
        objectivePhase: "pickup",
        cargoOnboard: false,
        targetDistance: 180,
        speed: 0
      })
    ).toBeUndefined();
  });

  it("keeps first-route hints to one compact action", () => {
    expect(
      buildGhostCoachCue({
        enabled: true,
        eligible: true,
        status: "paused",
        objectivePhase: "pickup",
        cargoOnboard: false,
        speed: 0
      })
    ).toEqual({
      label: "Coach",
      action: "Aim",
      detail: "Set nose",
      tone: "aim"
    });

    expect(
      buildGhostCoachCue({
        enabled: true,
        eligible: true,
        status: "flying",
        objectivePhase: "pickup",
        cargoOnboard: false,
        targetDistance: 190,
        speed: 2
      })
    ).toMatchObject({
      action: "Boost",
      detail: "Close gap"
    });

    expect(
      buildGhostCoachCue({
        enabled: true,
        eligible: true,
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        landingStatus: "too-fast",
        targetDistance: 32,
        speed: 48
      })
    ).toMatchObject({
      action: "Brake",
      detail: "Slow dock"
    });
  });
});
