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
      visible: true,
      expanded: false,
      showRadioMessage: false,
      showRouteTempo: false,
      showPrimaryStatusRows: false,
      showActionChips: false,
      showTelemetryChips: false,
      showRunFeed: false
    });
  });

  it("hides the live run panel while overlays own the screen", () => {
    expect(
      buildLiveHudDensity({
        status: "paused",
        preflightOpen: true,
        objectivePhase: "pickup"
      })
    ).toEqual({
      visible: false,
      expanded: false,
      showRadioMessage: false,
      showRouteTempo: false,
      showPrimaryStatusRows: false,
      showActionChips: false,
      showTelemetryChips: false,
      showRunFeed: false
    });

    expect(
      buildLiveHudDensity({
        status: "delivered",
        preflightOpen: false,
        objectivePhase: "complete"
      }).visible
    ).toBe(false);

    expect(
      buildLiveHudDensity({
        status: "crashed",
        preflightOpen: false,
        objectivePhase: "delivery"
      }).visible
    ).toBe(false);
  });

  it("expands during final approach and danger pressure", () => {
    expect(
      buildLiveHudDensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        targetDistance: 110,
        cargoDamage: 0,
        fuelRatio: 0.72,
        paceTier: "silver",
        landingStatus: "approach"
      })
    ).toMatchObject({
      expanded: false,
      showRadioMessage: false,
      showActionChips: false
    });

    const finalApproachDensity = buildLiveHudDensity({
      status: "flying",
      preflightOpen: false,
      objectivePhase: "delivery",
      targetDistance: 86,
      cargoDamage: 0,
      fuelRatio: 0.72,
      paceTier: "silver"
    });

    expect(finalApproachDensity.expanded).toBe(true);
    expect(finalApproachDensity.showRadioMessage).toBe(true);
    expect(finalApproachDensity.showRouteTempo).toBe(true);
    expect(finalApproachDensity.showPrimaryStatusRows).toBe(false);
    expect(finalApproachDensity.showTelemetryChips).toBe(false);
    expect(finalApproachDensity.showRunFeed).toBe(false);

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
      })
    ).toMatchObject({
      showActionChips: true,
      showTelemetryChips: true
    });
  });

  it("keeps paused route review expanded with status rows", () => {
    const density = buildLiveHudDensity({
      status: "paused",
      preflightOpen: false,
      objectivePhase: "delivery",
      targetDistance: 86,
      cargoDamage: 0,
      fuelRatio: 0.72,
      paceTier: "silver"
    });

    expect(density.showPrimaryStatusRows).toBe(true);
    expect(density.showRunFeed).toBe(true);
  });

  it("keeps the event feed out of active flight even when the panel expands", () => {
    expect(
      buildLiveHudDensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        targetDistance: 48,
        cargoDamage: 0,
        fuelRatio: 0.72,
        paceTier: "silver"
      }).showRunFeed
    ).toBe(false);
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
      visible: true,
      expanded: false,
      showRadioMessage: false,
      showRouteTempo: false,
      showPrimaryStatusRows: false,
      showActionChips: false,
      showTelemetryChips: false,
      showRunFeed: false
    });
  });
});
