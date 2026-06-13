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
