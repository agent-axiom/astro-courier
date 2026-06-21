import { describe, expect, it } from "vitest";
import { buildBossLoop } from "./bossLoop";

describe("boss loop", () => {
  it("stays hidden on ordinary contracts", () => {
    expect(
      buildBossLoop({
        contractId: "first-light-delivery",
        missionType: "standard",
        status: "flying",
        objectivePhase: "pickup",
        cargoOnboard: false,
        interceptorCount: 0,
        riskGateCount: 0,
        clearedRiskGateCount: 0
      })
    ).toBeUndefined();
  });

  it("turns raid progress into compact boss phases", () => {
    expect(
      buildBossLoop({
        contractId: "forge-flagship-raid",
        missionType: "raid",
        status: "flying",
        objectivePhase: "pickup",
        cargoOnboard: false,
        interceptorCount: 0,
        riskGateCount: 3,
        clearedRiskGateCount: 1
      })
    ).toEqual({
      label: "Boss loop",
      phase: "breach",
      action: "Breach",
      detail: "1/3 gates",
      tone: "breach",
      progress: 0.33
    });

    expect(
      buildBossLoop({
        contractId: "forge-flagship-raid",
        missionType: "raid",
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        interceptorCount: 2,
        riskGateCount: 3,
        clearedRiskGateCount: 3
      })
    ).toMatchObject({
      phase: "guard",
      action: "Break Guard",
      detail: "2 hostiles",
      tone: "danger"
    });

    expect(
      buildBossLoop({
        contractId: "forge-flagship-raid",
        missionType: "raid",
        status: "flying",
        objectivePhase: "pickup",
        cargoOnboard: false,
        interceptorCount: 0,
        riskGateCount: 3,
        clearedRiskGateCount: 3
      })
    ).toMatchObject({
      phase: "beacon",
      action: "Plant Beacon",
      detail: "Reach core"
    });

    expect(
      buildBossLoop({
        contractId: "forge-flagship-raid",
        missionType: "raid",
        status: "flying",
        objectivePhase: "delivery",
        cargoOnboard: true,
        interceptorCount: 0,
        riskGateCount: 3,
        clearedRiskGateCount: 3,
        targetDistance: 54
      })
    ).toMatchObject({
      phase: "extract",
      action: "Extract",
      detail: "Dock 54m"
    });
  });
});
