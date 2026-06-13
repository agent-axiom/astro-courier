import { describe, expect, it } from "vitest";
import { buildApproachRewardReadout, buildDockingSpeedReadout } from "./docking";

describe("docking speed readout", () => {
  it("stays hidden until a target speed limit is known", () => {
    expect(buildDockingSpeedReadout({ speed: 12 })).toBeUndefined();
  });

  it("formats current speed against the active pad limit", () => {
    expect(buildDockingSpeedReadout({ speed: 18.25, allowedSpeed: 42 })).toEqual({
      label: "Dock speed",
      value: "18.3 / 42.0",
      tone: "normal"
    });
  });

  it("warns when current speed exceeds the active pad limit", () => {
    expect(buildDockingSpeedReadout({ speed: 44, allowedSpeed: 42 })).toEqual({
      label: "Dock speed",
      value: "44.0 / 42.0",
      tone: "over-limit"
    });
  });
});

describe("approach reward readout", () => {
  it("stays hidden before the player holds a meaningful stable approach", () => {
    expect(buildApproachRewardReadout({ approachStreakSeconds: 0.1 })).toBeUndefined();
  });

  it("shows progress toward the perfect approach setup window", () => {
    expect(buildApproachRewardReadout({ approachStreakSeconds: 0.6 })).toEqual({
      label: "Perfect setup",
      value: "0.6 / 1.0s",
      tone: "charging"
    });
  });

  it("shows the ready style payout once the setup window is banked", () => {
    expect(buildApproachRewardReadout({ approachStreakSeconds: 1.2 })).toEqual({
      label: "Perfect setup",
      value: "+220 ready",
      tone: "ready"
    });
  });
});
