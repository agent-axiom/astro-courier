import { describe, expect, it } from "vitest";
import { buildMissionProfile } from "./missionProfile";

describe("mission profile presentation", () => {
  it("frames stealth routes as quiet, low-text missions", () => {
    expect(
      buildMissionProfile({
        id: "silent-courier",
        title: "Silent Courier",
        missionType: "stealth",
        riskLabel: "Silent Run",
        rewardLabel: "Quiet route bonuses",
        refuelStationIds: [],
        riskGateCount: 0,
        enemyWave: { drones: 0, fighters: 0, brutes: 0 }
      })
    ).toEqual({
      label: "Silent run",
      value: "Stay quiet",
      detail: "Low signature",
      tone: "stealth"
    });
  });

  it("frames chase routes as fast moving delivery targets", () => {
    expect(
      buildMissionProfile({
        id: "comet-chase",
        title: "Comet Chase",
        missionType: "chase",
        riskLabel: "Moving Target",
        rewardLabel: "Comet chase bonuses",
        refuelStationIds: [],
        riskGateCount: 4,
        enemyWave: { scouts: 2, fighters: 1 }
      })
    ).toMatchObject({
      label: "Comet chase",
      value: "Catch target",
      detail: "4 gates",
      tone: "chase"
    });
  });

  it("keeps longhaul and boss missions distinct", () => {
    expect(
      buildMissionProfile({
        id: "nebula-longhaul",
        title: "Nebula Longhaul",
        missionType: "longhaul",
        riskLabel: "Longhaul Nebula",
        rewardLabel: "Refuel route bonuses",
        refuelStationIds: ["relay-fuel-pad"],
        riskGateCount: 3
      })
    ).toMatchObject({ label: "Relay route", value: "Refuel x1", tone: "relay" });

    expect(
      buildMissionProfile({
        id: "forge-flagship-raid",
        title: "Forge Flagship Raid",
        missionType: "raid",
        difficultyTier: "boss",
        riskLabel: "Boss Raid",
        rewardLabel: "Flagship takedown",
        refuelStationIds: [],
        riskGateCount: 3,
        enemyWave: { missileBoats: 2, sentinels: 1 }
      })
    ).toMatchObject({ label: "Boss route", value: "Break guard", tone: "boss" });
  });
});
