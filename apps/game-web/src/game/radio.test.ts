import { describe, expect, it } from "vitest";
import { buildRadioMessage } from "./radio";
import type { HudState } from "./GameShell";

const baseHud: HudState = {
  status: "flying",
  objectivePhase: "pickup",
  contractTitle: "First Light Delivery",
  elapsedSeconds: 0,
  score: 0,
  fuel: 100,
  maxFuel: 100,
  cargoDamage: 0,
  cargoOnboard: false,
  speed: 0,
  medal: "none",
  scoreBreakdown: {
    base: 0,
    paceBonus: 0,
    fuelBonus: 0,
    cargoBonus: 0,
    landingBonus: 0,
    incidentPenalty: 0,
    total: 0
  },
  landingStatus: "approach",
  targetDistance: 220,
  paceTier: "gold",
  paceSecondsRemaining: 35,
  approachStreakSeconds: 0,
  bestApproachStreakSeconds: 0,
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

  it("warns about hazard pressure before ordinary approach guidance", () => {
    expect(buildRadioMessage({ ...baseHud, hazardDangerLevel: "inside", hazardDistance: 12 })).toContain("Hazard");
    expect(buildRadioMessage({ ...baseHud, hazardDangerLevel: "near", hazardDistance: 44 })).toContain("Asteroid");
  });

  it("praises a held stable approach before generic landing guidance", () => {
    expect(buildRadioMessage({ ...baseHud, landingStatus: "ready", approachStreakSeconds: 1.4 })).toContain("steady");
  });

  it("keeps preflight copy distinct from active pickup guidance", () => {
    expect(buildRadioMessage({ ...baseHud, status: "paused" })).toContain("Contract loaded");
  });

  it("celebrates strong deliveries and reports crashes", () => {
    expect(buildRadioMessage({ ...baseHud, status: "delivered", medal: "comet" })).toContain("Comet");
    expect(buildRadioMessage({ ...baseHud, status: "crashed", landingRating: "Insurance Event" })).toContain("Insurance");
    expect(buildRadioMessage({ ...baseHud, status: "crashed", crashReason: "Hard Landing" })).toContain("Bleed speed");
  });
});
