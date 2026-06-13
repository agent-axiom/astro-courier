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
  fuelUsed: 0,
  boostCooldownSeconds: 0,
  cargoDamage: 0,
  cargoOnboard: false,
  manualBrakeUsed: false,
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
  launchBurstSecondsRemaining: 0,
  hazardDangerLevel: undefined,
  hazardDistance: undefined,
  runTrail: [],
  replayFrameCount: 0
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

  it("coaches clean hazard skims toward needle thread speed", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        hazardDangerLevel: "near",
        hazardDistance: 44,
        cargoDamage: 0,
        speed: 36
      })
    ).toContain("Build 42+ speed");
  });

  it("warns about predicted hazard intercepts before generic objective guidance", () => {
    expect(buildRadioMessage({ ...baseHud, trajectoryRiskLevel: "inside", trajectoryRiskSeconds: 1.2 })).toContain(
      "Trajectory intersects hazard"
    );
  });

  it("calls out fast predicted hazard edge vectors as thread opportunities", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        trajectoryRiskLevel: "near",
        trajectoryRiskSeconds: 0.8,
        speed: 46,
        cargoDamage: 0
      })
    ).toContain("Thread vector");
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

  it("celebrates gravity slings before generic objective guidance", () => {
    expect(buildRadioMessage({ ...baseHud, lastMilestone: "Gravity Sling", objectivePhase: "delivery", cargoOnboard: true })).toContain(
      "Gravity sling"
    );
  });

  it("celebrates quick cargo pickups before generic objective guidance", () => {
    expect(buildRadioMessage({ ...baseHud, lastMilestone: "Quick Pickup", objectivePhase: "delivery", cargoOnboard: true })).toContain(
      "Fast pickup"
    );
  });

  it("arms launch burst guidance before generic quick pickup copy", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        lastMilestone: "Quick Pickup",
        objectivePhase: "delivery",
        cargoOnboard: true,
        launchBurstSecondsRemaining: 2.4
      })
    ).toContain("Launch burst armed");
  });

  it("celebrates launch bursts before generic delivery guidance", () => {
    expect(buildRadioMessage({ ...baseHud, lastMilestone: "Launch Burst", objectivePhase: "delivery", cargoOnboard: true })).toContain(
      "Launch burst"
    );
  });

  it("celebrates express finishes before generic medal copy", () => {
    expect(buildRadioMessage({ ...baseHud, status: "delivered", medal: "gold", lastMilestone: "Express Finish" })).toContain("Express finish");
  });

  it("celebrates damage control recoveries before generic delivery copy", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        status: "delivered",
        medal: "silver",
        cargoDamage: 0.18,
        lastMilestone: "Damage Control"
      })
    ).toContain("Damage control");
  });

  it("celebrates last-drop finishes before generic medal copy", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        status: "delivered",
        medal: "silver",
        fuel: 4,
        maxFuel: 100,
        lastMilestone: "Last Drop"
      })
    ).toContain("Last drop");
  });

  it("celebrates no-brake finesse finishes before generic medal copy", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        status: "delivered",
        medal: "silver",
        lastMilestone: "No Brake Finesse"
      })
    ).toContain("No-brake finesse");
  });

  it("praises a held stable approach before generic landing guidance", () => {
    expect(buildRadioMessage({ ...baseHud, landingStatus: "ready", approachStreakSeconds: 1.4 })).toContain("Perfect setup");
    expect(buildRadioMessage({ ...baseHud, landingStatus: "ready", approachStreakSeconds: 1.4 })).toContain("+220");
  });

  it("warns about critical fuel before generic objective guidance", () => {
    expect(buildRadioMessage({ ...baseHud, fuel: 10, maxFuel: 100, landingStatus: "approach" })).toContain("Fuel critical");
  });

  it("surfaces a ready last-drop dock before generic critical fuel", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        objectivePhase: "delivery",
        cargoOnboard: true,
        landingStatus: "ready",
        fuel: 4,
        maxFuel: 100,
        cargoDamage: 0
      })
    ).toContain("Last drop window");
  });

  it("previews the multiplied last-drop radio payout during an active style chain", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        objectivePhase: "delivery",
        cargoOnboard: true,
        landingStatus: "ready",
        fuel: 4,
        maxFuel: 100,
        cargoDamage: 0,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 2.4
      })
    ).toContain("+255");
  });

  it("keeps low last-drop fuel as a warning until the dock is ready", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        objectivePhase: "delivery",
        cargoOnboard: true,
        landingStatus: "misaligned",
        fuel: 4,
        maxFuel: 100,
        cargoDamage: 0
      })
    ).toContain("Fuel critical");
  });

  it("warns about tight comet reserve before generic delivery guidance", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        objectivePhase: "delivery",
        cargoOnboard: true,
        paceTier: "gold",
        fuel: 78,
        maxFuel: 100,
        cargoDamage: 0,
        landingStatus: "approach"
      })
    ).toContain("Comet reserve tight");
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

  it("coaches chain relay deliveries to carry an active style chain into dock", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        contractId: "chain-relay",
        objectivePhase: "delivery",
        cargoOnboard: true,
        paceSecondsRemaining: 9,
        styleChainCount: 2,
        styleChainSecondsRemaining: 2.4,
        styleMultiplier: 1.5
      })
    ).toContain("Chain relay live");
  });

  it("warns when the express finish window is about to close", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        objectivePhase: "delivery",
        cargoOnboard: true,
        paceTier: "gold",
        paceSecondsRemaining: 4.2,
        cargoDamage: 0
      })
    ).toContain("Express window");
  });

  it("points fading style chains at an immediate hazard skim before generic hazard copy", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        hazardDangerLevel: "near",
        hazardDistance: 44,
        cargoDamage: 0,
        speed: 28,
        styleChainCount: 2,
        styleChainSecondsRemaining: 0.8,
        styleMultiplier: 1.5
      })
    ).toContain("Skim the hazard edge now");
  });

  it("points fading style chains at a ready gravity sling before generic sling copy", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        objectivePhase: "delivery",
        cargoOnboard: true,
        gravitySlingDistance: 150,
        gravitySlingReady: true,
        gravitySlingSpeedThreshold: 54,
        gravitySlingStyleBonus: 240,
        styleChainCount: 2,
        styleChainSecondsRemaining: 0.8,
        styleMultiplier: 1.5
      })
    ).toContain("Hold the sling arc now");
  });

  it("points fading style chains at quick pickup while the pickup window is live", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        quickPickupSecondsRemaining: 4.2,
        styleChainCount: 2,
        styleChainSecondsRemaining: 0.8,
        styleMultiplier: 1.5
      })
    ).toContain("Take the pickup now");
  });

  it("points fading style chains at an armed launch burst before generic delivery guidance", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        objectivePhase: "delivery",
        cargoOnboard: true,
        quickPickupSecondsRemaining: 0,
        launchBurstSecondsRemaining: 1.8,
        styleChainCount: 2,
        styleChainSecondsRemaining: 0.8,
        styleMultiplier: 1.5
      })
    ).toContain("Hit Boost now for the burst");
  });

  it("coaches gravity sling setup before generic objective guidance", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        gravitySlingDistance: 160,
        gravitySlingReady: false,
        gravitySlingSpeedThreshold: 54,
        gravitySlingStyleBonus: 240
      })
    ).toContain("Build 54+ speed");
  });

  it("calls out a ready gravity sling window with payout", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        objectivePhase: "delivery",
        cargoOnboard: true,
        gravitySlingDistance: 150,
        gravitySlingReady: true,
        gravitySlingSpeedThreshold: 54,
        gravitySlingStyleBonus: 240
      })
    ).toContain("Sling window open for +240");
  });

  it("keeps preflight copy distinct from active pickup guidance", () => {
    expect(buildRadioMessage({ ...baseHud, status: "paused" })).toContain("Contract loaded");
  });

  it("calls out rush cargo in preflight radio copy", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        status: "paused",
        contractId: "last-drop-run",
        cargoName: "Midnight Medicine",
        cargoKind: "time-sensitive",
        cargoFragility: 0.9,
        paceSecondsRemaining: 27
      })
    ).toBe("Rush cargo loaded: Midnight Medicine. Gold window is 27.0s; launch clean.");
  });

  it("reports asteroid sprint hull collisions as asteroid impacts", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        status: "crashed",
        contractId: "asteroid-sprint",
        crashReason: "Hull Collision"
      })
    ).toContain("Asteroid impact");
  });

  it("reports chain relay hull collisions as relay lane impacts", () => {
    expect(
      buildRadioMessage({
        ...baseHud,
        status: "crashed",
        contractId: "chain-relay",
        crashReason: "Hull Collision"
      })
    ).toContain("Relay lane impact");
  });

  it("celebrates strong deliveries and reports crashes", () => {
    expect(buildRadioMessage({ ...baseHud, status: "delivered", medal: "gold", lastMilestone: "Perfect Approach" })).toContain(
      "Perfect approach"
    );
    expect(buildRadioMessage({ ...baseHud, status: "delivered", medal: "gold", lastMilestone: "Eco Drift" })).toContain("Eco drift");
    expect(buildRadioMessage({ ...baseHud, status: "delivered", medal: "gold", lastMilestone: "No Brake Finesse" })).toContain(
      "No-brake finesse"
    );
    expect(buildRadioMessage({ ...baseHud, status: "delivered", medal: "gold", lastMilestone: "Chain Finish" })).toContain("Chain finish");
    expect(buildRadioMessage({ ...baseHud, status: "delivered", medal: "comet" })).toContain("Comet");
    expect(buildRadioMessage({ ...baseHud, status: "crashed", landingRating: "Insurance Event" })).toContain("Insurance");
    expect(buildRadioMessage({ ...baseHud, status: "crashed", crashReason: "Hard Landing" })).toContain("Bleed speed");
  });
});
