import { describe, expect, it } from "vitest";
import { buildLiveHudDensity } from "./liveHudDensity";

describe("live HUD density", () => {
  it("keeps ordinary cruise focused on the flight director", () => {
    expect(
      buildLiveHudDensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        targetDistance: 244,
        cargoDamage: 0,
        fuelRatio: 0.72,
        paceTier: "silver"
      })
    ).toEqual({
      expanded: false,
      showActionChips: false,
      showTelemetryChips: false
    });
  });

  it("expands during final approach and danger pressure", () => {
    expect(
      buildLiveHudDensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        targetDistance: 86,
        cargoDamage: 0,
        fuelRatio: 0.72,
        paceTier: "silver"
      }).expanded
    ).toBe(true);

    expect(
      buildLiveHudDensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        targetDistance: 244,
        cargoDamage: 0,
        fuelRatio: 0.72,
        paceTier: "silver",
        trajectoryRiskLevel: "inside"
      }).showActionChips
    ).toBe(true);
  });

  it("expands for active bonus windows and fragile run state", () => {
    expect(
      buildLiveHudDensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "pickup",
        targetDistance: 220,
        cargoDamage: 0,
        fuelRatio: 0.72,
        paceTier: "gold",
        quickPickupSecondsRemaining: 4.5
      }).showActionChips
    ).toBe(true);

    expect(
      buildLiveHudDensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        targetDistance: 220,
        cargoDamage: 0.11,
        fuelRatio: 0.72,
        paceTier: "silver"
      }).showTelemetryChips
    ).toBe(true);
  });

  it("ignores pickup rush timers after cargo is already loaded", () => {
    expect(
      buildLiveHudDensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        targetDistance: 240,
        cargoDamage: 0,
        fuelRatio: 0.72,
        paceTier: "silver",
        quickPickupSecondsRemaining: 4.5
      })
    ).toEqual({
      expanded: false,
      showActionChips: false,
      showTelemetryChips: false
    });
  });
});
