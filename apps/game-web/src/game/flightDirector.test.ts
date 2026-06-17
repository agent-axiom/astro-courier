import { describe, expect, it } from "vitest";
import { buildFlightDirector } from "./flightDirector";

describe("flight director", () => {
  it("keeps preflight actionable before the run launches", () => {
    expect(
      buildFlightDirector({
        status: "paused",
        objectivePhase: "pickup",
        cargoOnboard: false
      })
    ).toEqual({
      label: "Flight director",
      action: "Commit route",
      detail: "Launch when ready",
      tone: "idle",
      progress: 0
    });
  });

  it("prioritizes immediate danger over pickup rush opportunities", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "pickup",
        cargoOnboard: false,
        trajectoryRiskLevel: "inside",
        trajectoryRiskSeconds: 1.2,
        quickPickupSecondsRemaining: 7.2,
        quickPickupBonus: 180
      })
    ).toEqual({
      label: "Flight director",
      action: "Evade vector",
      detail: "Impact in 1.2s",
      tone: "danger",
      progress: 0.6
    });
  });

  it("turns a shield rebound into an immediate recovery directive", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        targetDistance: 180,
        lastMilestone: "Shield Rebound",
        emergencyShieldAvailable: false
      })
    ).toEqual({
      label: "Flight director",
      action: "Recover line",
      detail: "Shield spent",
      tone: "urgent",
      progress: 1
    });
  });

  it("turns ready docking windows into a direct command", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        landingStatus: "ready",
        cargoDamage: 0,
        targetDistance: 18
      })
    ).toEqual({
      label: "Flight director",
      action: "Dock now",
      detail: "Clean cargo",
      tone: "approach",
      progress: 1
    });
  });

  it("surfaces no-brake finesse when a clean dock is ready without manual braking", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        landingStatus: "ready",
        cargoDamage: 0,
        manualBrakeUsed: false,
        targetDistance: 18
      })
    ).toEqual({
      label: "Flight director",
      action: "Coast dock",
      detail: "+150 no brake",
      tone: "opportunity",
      progress: 1
    });
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        landingStatus: "ready",
        cargoDamage: 0,
        manualBrakeUsed: true,
        targetDistance: 18
      })
    ).toEqual({
      label: "Flight director",
      action: "Dock now",
      detail: "Clean cargo",
      tone: "approach",
      progress: 1
    });
  });

  it("guides charging perfect approach windows before the final dock command", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        landingStatus: "ready",
        approachStreakSeconds: 0.6,
        cargoDamage: 0,
        manualBrakeUsed: false,
        targetDistance: 18
      })
    ).toEqual({
      label: "Flight director",
      action: "Hold approach",
      detail: "0.6 / 1.0s",
      tone: "opportunity",
      progress: 0.6
    });
  });

  it("lets an armed perfect approach own the ready dock command", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        landingStatus: "ready",
        approachStreakSeconds: 1.2,
        cargoDamage: 0,
        manualBrakeUsed: false,
        targetDistance: 18
      })
    ).toEqual({
      label: "Flight director",
      action: "Perfect dock",
      detail: "+220 armed",
      tone: "opportunity",
      progress: 1
    });
  });

  it("cashouts a fading style chain before ordinary delivery guidance", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        targetDistance: 160,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8
      })
    ).toEqual({
      label: "Flight director",
      action: "Cash chain",
      detail: "x1.50 / 0.8s",
      tone: "urgent",
      progress: 0.33
    });
  });

  it("turns fading clean no-brake delivery chains into a finesse dock command", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        landingStatus: "ready",
        cargoDamage: 0,
        manualBrakeUsed: false,
        targetDistance: 18,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 0.8
      })
    ).toEqual({
      label: "Flight director",
      action: "Finesse dock",
      detail: "+150 / x1.50 / 0.8s",
      tone: "urgent",
      progress: 0.33
    });
  });

  it("frames quick pickup as a chain load while a multiplier is live", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "pickup",
        cargoOnboard: false,
        quickPickupSecondsRemaining: 4.2,
        quickPickupBonus: 180,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 2.4
      })
    ).toEqual({
      label: "Flight director",
      action: "Load chain",
      detail: "+180 / 4.2s / x1.50",
      tone: "opportunity",
      progress: 0.65
    });
  });

  it("keeps ordinary opening pickup rush copy short and readable", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "pickup",
        cargoOnboard: false,
        quickPickupSecondsRemaining: 12,
        quickPickupBonus: 180,
        styleMultiplier: 1
      })
    ).toEqual({
      label: "Flight director",
      action: "Load fast",
      detail: "Rush cargo",
      tone: "opportunity",
      progress: 0
    });
  });

  it("turns a clean near trajectory vector into a style opportunity", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        trajectoryRiskLevel: "near",
        trajectoryRiskSeconds: 0.8,
        speed: 46,
        cargoDamage: 0,
        targetDistance: 220
      })
    ).toEqual({
      label: "Flight director",
      action: "Thread vector",
      detail: "Edge in 0.8s",
      tone: "opportunity",
      progress: 0.73
    });
  });

  it("treats near trajectory vectors as a recovery command for damaged cargo", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        trajectoryRiskLevel: "near",
        trajectoryRiskSeconds: 2.1,
        cargoDamage: 0.18,
        targetDistance: 180
      })
    ).toEqual({
      label: "Flight director",
      action: "Clear vector",
      detail: "Cargo exposed / 2.1s",
      tone: "urgent",
      progress: 0.3
    });
  });

  it("switches ordinary pickup flight into a close-range lineup command", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "pickup",
        cargoOnboard: false,
        targetDistance: 74
      })
    ).toEqual({
      label: "Flight director",
      action: "Line up pickup",
      detail: "Pad 74m",
      tone: "approach",
      progress: 0.82
    });
  });

  it("switches ordinary delivery flight into a close-range dock lineup command", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        targetDistance: 86
      })
    ).toEqual({
      label: "Flight director",
      action: "Line up dock",
      detail: "Dock 86m",
      tone: "approach",
      progress: 0.79
    });
  });

  it("turns misaligned final dock approaches into a direct attitude command", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        landingStatus: "misaligned",
        targetDistance: 24
      })
    ).toEqual({
      label: "Flight director",
      action: "Align nose",
      detail: "Dock angle",
      tone: "approach",
      progress: 0.94
    });
  });

  it("keeps ordinary flight focused on the active objective", () => {
    expect(
      buildFlightDirector({
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        targetDistance: 244
      })
    ).toEqual({
      label: "Flight director",
      action: "Deliver cargo",
      detail: "Target 244m",
      tone: "approach",
      progress: 0.39
    });
  });
});
