import { describe, expect, it } from "vitest";
import { buildExpressFinishReadout, buildObjectiveDirective, buildObjectiveInterceptReadout, buildTacticalCue } from "./objective";

describe("objective directive HUD copy", () => {
  it("points pickup phase at the pickup pad", () => {
    expect(
      buildObjectiveDirective({
        objectivePhase: "pickup",
        pickupLabel: "Luma North Pad",
        destinationLabel: "Tea Station Dock A"
      })
    ).toEqual({
      label: "Pickup",
      value: "Luma North Pad"
    });
  });

  it("points delivery phase at the destination pad", () => {
    expect(
      buildObjectiveDirective({
        objectivePhase: "delivery",
        pickupLabel: "Luma North Pad",
        destinationLabel: "Tea Station Dock A"
      })
    ).toEqual({
      label: "Deliver",
      value: "Tea Station Dock A"
    });
  });

  it("surfaces the express finish window during clean gold-pace delivery", () => {
    expect(
      buildObjectiveDirective({
        objectivePhase: "delivery",
        pickupLabel: "Luma North Pad",
        destinationLabel: "Tea Station Dock A",
        paceTier: "gold",
        paceSecondsRemaining: 9.4,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Express finish",
      value: "Tea Station Dock A / 9.4s"
    });
  });

  it("keeps wrong-pad feedback focused on the required pickup", () => {
    expect(
      buildObjectiveDirective({
        objectivePhase: "pickup",
        pickupLabel: "Luma North Pad",
        destinationLabel: "Tea Station Dock A",
        lastMilestone: "Pickup Required"
      })
    ).toEqual({
      label: "Pickup first",
      value: "Luma North Pad"
    });
  });
});

describe("objective intercept readout", () => {
  it("hides when there is no active target or the run is finished", () => {
    expect(buildObjectiveInterceptReadout({ status: "flying", speed: 12 })).toBeUndefined();
    expect(buildObjectiveInterceptReadout({ status: "delivered", targetDistance: 40, speed: 12 })).toBeUndefined();
    expect(buildObjectiveInterceptReadout({ status: "crashed", targetDistance: 40, speed: 12 })).toBeUndefined();
  });

  it("asks the player to build speed when the target is known but the ship is drifting", () => {
    expect(buildObjectiveInterceptReadout({ status: "flying", targetDistance: 140, speed: 0.4 })).toEqual({
      label: "Intercept",
      value: "Build speed",
      tone: "hold"
    });
  });

  it("formats a fast target intercept ETA", () => {
    expect(buildObjectiveInterceptReadout({ status: "flying", targetDistance: 72, speed: 12 })).toEqual({
      label: "Intercept",
      value: "ETA 6.0s",
      tone: "fast"
    });
  });

  it("prioritizes the active dock window over ETA", () => {
    expect(buildObjectiveInterceptReadout({ status: "flying", targetDistance: 18, speed: 8, landingStatus: "ready" })).toEqual({
      label: "Intercept",
      value: "Dock now",
      tone: "fast"
    });
  });

  it("turns failed approach states into short correction calls", () => {
    expect(buildObjectiveInterceptReadout({ status: "flying", targetDistance: 18, speed: 48, landingStatus: "too-fast" })).toEqual({
      label: "Intercept",
      value: "Brake",
      tone: "hold"
    });

    expect(buildObjectiveInterceptReadout({ status: "flying", targetDistance: 18, speed: 12, landingStatus: "misaligned" })).toEqual({
      label: "Intercept",
      value: "Align nose",
      tone: "steady"
    });
  });

  it("marks long intercept lines as slow", () => {
    expect(buildObjectiveInterceptReadout({ status: "paused", targetDistance: 420, speed: 14 })).toEqual({
      label: "Intercept",
      value: "ETA 30.0s",
      tone: "slow"
    });
  });
});

describe("express finish readout", () => {
  it("surfaces the clean gold-pace delivery window", () => {
    expect(
      buildExpressFinishReadout({
        objectivePhase: "delivery",
        paceTier: "gold",
        paceSecondsRemaining: 8.6,
        cargoDamage: 0.01
      })
    ).toEqual({
      label: "Finish window",
      value: "Express +180 / 8.6s",
      tone: "open"
    });
  });

  it("turns urgent during the closing seconds", () => {
    expect(
      buildExpressFinishReadout({
        objectivePhase: "delivery",
        paceTier: "gold",
        paceSecondsRemaining: 3.8,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Finish window",
      value: "Close now / +180 / 3.8s",
      tone: "urgent"
    });
  });

  it("hides outside clean gold-pace delivery", () => {
    expect(
      buildExpressFinishReadout({
        objectivePhase: "pickup",
        paceTier: "gold",
        paceSecondsRemaining: 8.6,
        cargoDamage: 0
      })
    ).toBeUndefined();
    expect(
      buildExpressFinishReadout({
        objectivePhase: "delivery",
        paceTier: "silver",
        paceSecondsRemaining: 8.6,
        cargoDamage: 0
      })
    ).toBeUndefined();
    expect(
      buildExpressFinishReadout({
        objectivePhase: "delivery",
        paceTier: "gold",
        paceSecondsRemaining: 0,
        cargoDamage: 0
      })
    ).toBeUndefined();
    expect(
      buildExpressFinishReadout({
        objectivePhase: "delivery",
        paceTier: "gold",
        paceSecondsRemaining: 8.6,
        cargoDamage: 0.03
      })
    ).toBeUndefined();
  });
});

describe("tactical cue", () => {
  it("prioritizes an incoming collision vector over scoring windows", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        trajectoryRiskLevel: "inside",
        trajectoryRiskSeconds: 1.2,
        paceTier: "gold",
        paceSecondsRemaining: 3.8,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Tactical cue",
      value: "Evade vector / 1.2s",
      tone: "danger"
    });
  });

  it("calls out the express finish when the clean gold window is closing", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        paceTier: "gold",
        paceSecondsRemaining: 3.8,
        cargoDamage: 0.01
      })
    ).toEqual({
      label: "Tactical cue",
      value: "Close express / +180 / 3.8s",
      tone: "opportunity"
    });
  });

  it("points an urgent style chain at a ready gravity sling", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        gravitySlingReady: true,
        gravitySlingStyleBonus: 240,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Tactical cue",
      value: "Sling now / x1.50 / 0.8s",
      tone: "urgent"
    });
  });

  it("points an urgent style chain at a banked perfect approach", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        landingStatus: "ready",
        approachStreakSeconds: 1.2,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Tactical cue",
      value: "Soft dock / +220 / 0.8s",
      tone: "urgent"
    });
  });

  it("surfaces a ready gravity sling payout as an immediate opportunity", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        gravitySlingReady: true,
        gravitySlingStyleBonus: 240,
        styleMultiplier: 1.5,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Tactical cue",
      value: "Sling now / +360 / x1.50",
      tone: "opportunity"
    });
  });

  it("surfaces a banked perfect approach dock payout", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        landingStatus: "ready",
        approachStreakSeconds: 1.2,
        cargoDamage: 0
      })
    ).toEqual({
      label: "Tactical cue",
      value: "Soft dock / +220",
      tone: "opportunity"
    });
  });

  it("does not call a perfect approach before the setup is banked", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        landingStatus: "ready",
        approachStreakSeconds: 0.6,
        cargoDamage: 0
      })
    ).toBeUndefined();
  });

  it("keeps express finish ahead of eco drift while the clean gold window is closing", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        paceTier: "gold",
        paceSecondsRemaining: 3.8,
        cargoDamage: 0,
        fuelUsed: 8
      })
    ).toEqual({
      label: "Tactical cue",
      value: "Close express / +180 / 3.8s",
      tone: "opportunity"
    });
  });

  it("keeps closing express ahead of tight comet reserve", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        paceTier: "gold",
        paceSecondsRemaining: 3.8,
        cargoDamage: 0,
        fuel: 78,
        maxFuel: 100
      })
    ).toEqual({
      label: "Tactical cue",
      value: "Close express / +180 / 3.8s",
      tone: "opportunity"
    });
  });

  it("does not promise eco drift while an express finish can still score", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        paceTier: "gold",
        paceSecondsRemaining: 9.5,
        cargoDamage: 0,
        fuelUsed: 8
      })
    ).toBeUndefined();
  });

  it("warns while comet reserve is tight but still recoverable", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        paceTier: "gold",
        paceSecondsRemaining: 9.5,
        cargoDamage: 0,
        fuel: 78,
        maxFuel: 100
      })
    ).toEqual({
      label: "Tactical cue",
      value: "Save comet reserve / 78%",
      tone: "urgent"
    });
  });

  it("does not warn for comet reserve after the reserve floor is already gone", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        paceTier: "gold",
        paceSecondsRemaining: 9.5,
        cargoDamage: 0,
        fuel: 74,
        maxFuel: 100
      })
    ).toBeUndefined();
  });

  it("surfaces eco drift when clean delivery is still fuel-efficient outside express pace", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        paceTier: "silver",
        paceSecondsRemaining: 9.5,
        cargoDamage: 0,
        fuelUsed: 8
      })
    ).toEqual({
      label: "Tactical cue",
      value: "Eco drift / +160",
      tone: "opportunity"
    });
  });

  it("turns an active pickup rush into an immediate cue", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "pickup",
        quickPickupSecondsRemaining: 7.2,
        quickPickupBonus: 180
      })
    ).toEqual({
      label: "Tactical cue",
      value: "Rush pickup / +180 / 7.2s",
      tone: "opportunity"
    });
  });

  it("surfaces damaged cargo recovery while a salvage delivery is still possible", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        cargoDamage: 0.18
      })
    ).toEqual({
      label: "Tactical cue",
      value: "Damage control / +140",
      tone: "opportunity"
    });
  });

  it("does not promise damage control after the cargo is too compromised", () => {
    expect(
      buildTacticalCue({
        status: "flying",
        objectivePhase: "delivery",
        cargoDamage: 0.52
      })
    ).toBeUndefined();
  });

  it("hides outside active flight", () => {
    expect(
      buildTacticalCue({
        status: "paused",
        objectivePhase: "pickup",
        quickPickupSecondsRemaining: 7.2,
        quickPickupBonus: 180
      })
    ).toBeUndefined();
  });
});
