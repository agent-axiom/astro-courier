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
  landingStatus: "approach",
  targetDistance: 220
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

  it("celebrates strong deliveries and reports crashes", () => {
    expect(buildRadioMessage({ ...baseHud, status: "delivered", medal: "comet" })).toContain("Comet");
    expect(buildRadioMessage({ ...baseHud, status: "crashed", landingRating: "Insurance Event" })).toContain("Insurance");
  });
});

