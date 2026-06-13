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
});
