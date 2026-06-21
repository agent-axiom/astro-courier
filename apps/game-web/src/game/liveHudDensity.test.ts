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
      showDockingLane: false,
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
      showDockingLane: false,
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

  it("keeps routine final approach quiet until the approach actually needs help", () => {
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

    expect(finalApproachDensity.expanded).toBe(false);
    expect(finalApproachDensity.showRadioMessage).toBe(false);
    expect(finalApproachDensity.showRouteTempo).toBe(false);
    expect(finalApproachDensity.showPrimaryStatusRows).toBe(false);
    expect(finalApproachDensity.showDockingLane).toBe(false);
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
        paceTier: "silver",
        landingStatus: "approach"
      })
    ).toMatchObject({
      expanded: false,
      showRadioMessage: false,
      showRouteTempo: false,
      showActionChips: false,
      showDockingLane: false,
      showTelemetryChips: false
    });

    expect(
      buildLiveHudDensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        targetDistance: 86,
        cargoDamage: 0,
        fuelRatio: 0.72,
        paceTier: "silver",
        landingStatus: "misaligned"
      })
    ).toMatchObject({
      expanded: false,
      showRadioMessage: false,
      showRouteTempo: false,
      showActionChips: false,
      showDockingLane: true,
      showTelemetryChips: false
    });

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

  it("keeps ready delivery docking quiet so the target lock and flight director own attention", () => {
    expect(
      buildLiveHudDensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        targetDistance: 42,
        cargoDamage: 0,
        fuelRatio: 0.72,
        paceTier: "gold",
        landingStatus: "ready"
      })
    ).toEqual({
      visible: true,
      expanded: false,
      showRadioMessage: false,
      showRouteTempo: false,
      showPrimaryStatusRows: false,
      showActionChips: false,
      showDockingLane: true,
      showTelemetryChips: false,
      showRunFeed: false
    });
  });

  it("shows a docking lane for final approach problems without opening the whole panel", () => {
    expect(
      buildLiveHudDensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        targetDistance: 54,
        cargoDamage: 0,
        fuelRatio: 0.72,
        paceTier: "silver",
        landingStatus: "too-fast"
      })
    ).toMatchObject({
      expanded: false,
      showRadioMessage: false,
      showActionChips: false,
      showDockingLane: true,
      showTelemetryChips: false
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

  it("keeps bonus windows in compact meters instead of expanding the run panel", () => {
    for (const bonusInput of [
      { styleMultiplier: 1.25 },
      { styleChainSecondsRemaining: 2.8 },
      { gravitySlingReady: true }
    ]) {
      expect(
        buildLiveHudDensity({
          status: "flying",
          preflightOpen: false,
          objectivePhase: "pickup",
          targetDistance: 220,
          cargoDamage: 0,
          fuelRatio: 0.72,
          paceTier: "gold",
          ...bonusInput
        })
      ).toMatchObject({
        expanded: false,
        showRadioMessage: false,
        showRouteTempo: false,
        showActionChips: false,
        showTelemetryChips: false
      });
    }

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

  it("keeps early pickup rush focused when a hazard is only nearby", () => {
    expect(
      buildLiveHudDensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "pickup",
        targetDistance: 141,
        cargoDamage: 0,
        fuelRatio: 1,
        paceTier: "gold",
        hazardDangerLevel: "near",
        quickPickupSecondsRemaining: 12,
        styleMultiplier: 1
      })
    ).toEqual({
      visible: true,
      expanded: false,
      showRadioMessage: false,
      showRouteTempo: false,
      showPrimaryStatusRows: false,
      showActionChips: false,
      showDockingLane: false,
      showTelemetryChips: false,
      showRunFeed: false
    });
  });

  it("still expands early pickup rush when the ship is inside a hazard", () => {
    expect(
      buildLiveHudDensity({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "pickup",
        targetDistance: 80,
        cargoDamage: 0,
        fuelRatio: 1,
        paceTier: "gold",
        hazardDangerLevel: "inside",
        quickPickupSecondsRemaining: 8
      })
    ).toMatchObject({
      expanded: true,
      showRadioMessage: false,
      showRouteTempo: false,
      showActionChips: true,
      showTelemetryChips: true
    });
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
      showDockingLane: false,
      showTelemetryChips: false,
      showRunFeed: false
    });
  });
});
