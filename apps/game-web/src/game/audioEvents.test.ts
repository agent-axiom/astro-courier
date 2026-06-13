import { describe, expect, it } from "vitest";
import { deriveHudAudioEvents, type HudAudioSnapshot } from "./audioEvents";

const baseSnapshot: HudAudioSnapshot = {
  status: "flying",
  lastMilestone: undefined,
  fuel: 100,
  maxFuel: 100,
  hazardDangerLevel: undefined,
  trajectoryRiskLevel: undefined
};

describe("HUD audio events", () => {
  it("emits terminal run events once when status changes", () => {
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, status: "delivered" })).toEqual(["delivery-complete"]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, status: "crashed" })).toEqual(["ship-crash"]);
    expect(deriveHudAudioEvents({ ...baseSnapshot, status: "delivered" }, { ...baseSnapshot, status: "delivered" })).toEqual([]);
  });

  it("maps fresh milestones to expressive sound events", () => {
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "Assist Burn" })).toEqual(["assist-burn"]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "Boost Burn" })).toEqual(["boost-burn"]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "Launch Burst" })).toEqual(["launch-burst"]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "Gravity Sling" })).toEqual(["style-hit"]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "No Brake Finesse" })).toEqual(["style-hit"]);
  });

  it("ignores service milestones that are not audio-worthy style hits", () => {
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "Pickup Required" })).toEqual([]);
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, lastMilestone: "Cargo Loaded" })).toEqual([]);
  });

  it("warns when fuel crosses into the critical band", () => {
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, fuel: 14 })).toEqual(["fuel-critical"]);
    expect(deriveHudAudioEvents({ ...baseSnapshot, fuel: 14 }, { ...baseSnapshot, fuel: 13 })).toEqual([]);
  });

  it("warns once when the current medal window drops", () => {
    expect(deriveHudAudioEvents({ ...baseSnapshot, paceTier: "gold" }, { ...baseSnapshot, paceTier: "silver" })).toEqual(["medal-drop"]);
    expect(deriveHudAudioEvents({ ...baseSnapshot, paceTier: "silver" }, { ...baseSnapshot, paceTier: "silver" })).toEqual([]);
  });

  it("warns when the ship enters a hazard", () => {
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, hazardDangerLevel: "inside" })).toEqual(["hazard-contact"]);
    expect(deriveHudAudioEvents({ ...baseSnapshot, hazardDangerLevel: "inside" }, { ...baseSnapshot, hazardDangerLevel: "inside" })).toEqual([]);
  });

  it("warns once when the predicted trajectory turns dangerous", () => {
    expect(deriveHudAudioEvents(baseSnapshot, { ...baseSnapshot, trajectoryRiskLevel: "inside" })).toEqual(["trajectory-warning"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, trajectoryRiskLevel: "inside" },
        { ...baseSnapshot, trajectoryRiskLevel: "inside" }
      )
    ).toEqual([]);
    expect(
      deriveHudAudioEvents({ ...baseSnapshot, trajectoryRiskLevel: "near" }, { ...baseSnapshot, trajectoryRiskLevel: "inside" })
    ).toEqual(["trajectory-warning"]);
  });

  it("celebrates the first live personal-best score lead", () => {
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, score: 3280, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3440, bestRunScore: 3290 }
      )
    ).toEqual(["pb-lead"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, score: 3440, bestRunScore: 3290 },
        { ...baseSnapshot, score: 3510, bestRunScore: 3290 }
      )
    ).toEqual([]);
  });

  it("warns once when an active style chain reaches the critical window", () => {
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, styleMultiplier: 1.35, styleChainSecondsRemaining: 1.35 },
        { ...baseSnapshot, styleMultiplier: 1.35, styleChainSecondsRemaining: 0.85 }
      )
    ).toEqual(["chain-critical"]);
    expect(
      deriveHudAudioEvents(
        { ...baseSnapshot, styleMultiplier: 1.35, styleChainSecondsRemaining: 0.85 },
        { ...baseSnapshot, styleMultiplier: 1.35, styleChainSecondsRemaining: 0.45 }
      )
    ).toEqual([]);
  });
});
