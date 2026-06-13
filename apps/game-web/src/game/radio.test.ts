import { describe, expect, it } from "vitest";
import { buildRadioMessage } from "./radio";
import type { HudState } from "./GameShell";

const baseHud: HudState = {
  status: "flying",
  objectivePhase: "pickup",
  contractId: "first-light-delivery",
  contractTitle: "First Light Delivery",
  contractBriefing: "Run the standard Luma courier line.",
  contractRiskLabel: "Training Route",
  contractRewardLabel: "Clean delivery bonuses",
  pickupLabel: "Luma North Pad",
  destinationLabel: "Tea Station Dock A",
  cargoName: "Bottled Starlight",
  cargoKind: "fragile",
  cargoFragility: 0.8,
  contractOptions: [
    {
      id: "first-light-delivery",
      title: "First Light Delivery",
      briefing: "Run the standard Luma courier line.",
      riskLabel: "Training Route",
      rewardLabel: "Clean delivery bonuses",
      pickupLabel: "Luma North Pad",
      destinationLabel: "Tea Station Dock A",
      cargoName: "Bottled Starlight",
      cargoKind: "fragile",
      cargoFragility: 0.8,
      medalTimes: { bronze: 90, silver: 55, gold: 35 }
    }
  ],
  elapsedSeconds: 0,
  score: 0,
  fuel: 100,
  maxFuel: 100,
  boostCooldownSeconds: 0,
  cargoDamage: 0,
  cargoOnboard: false,
  speed: 0,
  medal: "none",
  grade: "F",
  scoreBreakdown: {
    base: 0,
    paceBonus: 0,
    fuelBonus: 0,
    cargoBonus: 0,
    landingBonus: 0,
    styleBonus: 0,
    dangerBonus: 0,
    incidentPenalty: 0,
    total: 0
  },
  landingStatus: "approach",
  targetDistance: 220,
  targetAllowedSpeed: 42,
  paceTier: "gold",
  paceSecondsRemaining: 35,
  quickPickupSecondsRemaining: 12,
  quickPickupBonus: 180,
  approachStreakSeconds: 0,
  bestApproachStreakSeconds: 0,
  styleChainCount: 0,
  styleChainSecondsRemaining: 0,
  styleMultiplier: 1,
  hazardDangerLevel: undefined,
  hazardDistance: undefined
};

describe("radio feedback copy", () => {
  it("coaches pickup and delivery phases", () => {
    expect(buildRadioMessage(baseHud)).toContain("Pickup");
    expect(buildRadioMessage({ ...baseHud, objectivePhase: "delivery", cargoOnboard: true })).toContain("destination");
  });

  it("surfaces landing assist before generic speed warnings", () => {
    expect(buildRadioMessage({ ...baseHud, landingStatus: "too-fast", assistAvailable: true })).toContain("Assist");
    expect(buildRadioMessage({ ...baseHud, landingStatus: "too-fast", assistAvailable: false })).toContain("Slow");
  });

  it("confirms assist burns before generic landing guidance", () => {
    expect(buildRadioMessage({ ...baseHud, lastMilestone: "Assist Burn", landingStatus: "too-fast", assistAvailable: false })).toContain(
      "Assist burn fired"
    );
  });

  it("warns about hazard pressure before ordinary approach guidance", () => {
    expect(buildRadioMessage({ ...baseHud, hazardDangerLevel: "inside", hazardDistance: 12 })).toContain("Hazard");
    expect(buildRadioMessage({ ...baseHud, hazardDangerLevel: "near", hazardDistance: 44 })).toContain("Asteroid");
  });

  it("warns about predicted hazard intercepts before generic objective guidance", () => {
    expect(buildRadioMessage({ ...baseHud, trajectoryRiskLevel: "inside", trajectoryRiskSeconds: 1.2 })).toContain(
      "Trajectory intersects hazard"
    );
  });

  it("warns about damaged cargo before generic hazard proximity", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        cargoOnboard: true,
        cargoDamage: 0.22,
        hazardDangerLevel: "near",
        hazardDistance: 44
      })
    ).toContain("Cargo integrity 78%");
  });

  it("celebrates clean hazard skims before generic hazard warnings", () => {
    expect(buildRadioMessage({ ...baseHud, lastMilestone: "Clean Hazard Skim", hazardDangerLevel: "near", hazardDistance: 44 })).toContain("Style");
    expect(buildRadioMessage({ ...baseHud, lastMilestone: "Needle Thread", hazardDangerLevel: "near", hazardDistance: 44 })).toContain(
      "Needle thread"
    );
  });

  it("celebrates quick cargo pickups before generic objective guidance", () => {
    expect(buildRadioMessage({ ...baseHud, lastMilestone: "Quick Pickup", objectivePhase: "delivery", cargoOnboard: true })).toContain(
      "Fast pickup"
    );
  });

  it("praises a held stable approach before generic landing guidance", () => {
    expect(buildRadioMessage({ ...baseHud, landingStatus: "ready", approachStreakSeconds: 1.4 })).toContain("Perfect setup");
    expect(buildRadioMessage({ ...baseHud, landingStatus: "ready", approachStreakSeconds: 1.4 })).toContain("+220");
  });

  it("warns about critical fuel before generic objective guidance", () => {
    expect(buildRadioMessage({ ...baseHud, fuel: 10, maxFuel: 100, landingStatus: "approach" })).toContain("Fuel critical");
  });

  it("warns when a style chain is about to expire before generic objective guidance", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        objectivePhase: "delivery",
        cargoOnboard: true,
        styleChainCount: 2,
        styleChainSecondsRemaining: 0.8,
        styleMultiplier: 1.5
      })
    ).toContain("Style chain fading");
  });

  it("keeps preflight copy distinct from active pickup guidance", () => {
    expect(buildRadioMessage({ ...baseHud, status: "paused" })).toContain("Contract loaded");
  });

  it("celebrates strong deliveries and reports crashes", () => {
    expect(buildRadioMessage({ ...baseHud, status: "delivered", medal: "gold", lastMilestone: "Perfect Approach" })).toContain(
      "Perfect approach"
    );
    expect(buildRadioMessage({ ...baseHud, status: "delivered", medal: "gold", lastMilestone: "Eco Drift" })).toContain("Eco drift");
    expect(buildRadioMessage({ ...baseHud, status: "delivered", medal: "gold", lastMilestone: "Chain Finish" })).toContain("Chain finish");
    expect(buildRadioMessage({ ...baseHud, status: "delivered", medal: "comet" })).toContain("Comet");
    expect(buildRadioMessage({ ...baseHud, status: "crashed", landingRating: "Insurance Event" })).toContain("Insurance");
    expect(buildRadioMessage({ ...baseHud, status: "crashed", crashReason: "Hard Landing" })).toContain("Bleed speed");
  });
});
