import { describe, expect, it } from "vitest";
import { buildApproachRewardReadout, buildDockingSpeedReadout, buildLandingGuidanceLabel, buildLandingGuidancePresentation } from "./docking";

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

  it("commands braking when the ship is over limit on final approach", () => {
    expect(buildDockingSpeedReadout({ speed: 44, allowedSpeed: 42, targetDistance: 54 })).toEqual({
      label: "Dock speed",
      value: "Slow for clean 44.0 / 42.0",
      tone: "over-limit"
    });
  });

  it("keeps normal final approach speed readouts compact", () => {
    expect(buildDockingSpeedReadout({ speed: 32, allowedSpeed: 42, targetDistance: 54 })).toEqual({
      label: "Dock speed",
      value: "32.0 / 42.0",
      tone: "normal"
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
      tone: "charging",
      progress: 0.6
    });
  });

  it("shows the ready style payout once the setup window is banked", () => {
    expect(buildApproachRewardReadout({ approachStreakSeconds: 1.2 })).toEqual({
      label: "Perfect setup",
      value: "+220 ready",
      tone: "ready",
      progress: 1
    });
  });
});

describe("landing guidance label", () => {
  it("keeps live dock guidance short and action-led", () => {
    expect(buildLandingGuidanceLabel({ status: "approach" })).toBe("Line up");
    expect(buildLandingGuidanceLabel({ status: "too-fast" })).toBe("Slow for clean");
    expect(buildLandingGuidanceLabel({ status: "misaligned" })).toBe("Align for clean");
    expect(buildLandingGuidanceLabel({ status: "ready" })).toBe("Dock ready");
  });

  it("names slow off-angle ready contacts as soft docks", () => {
    expect(
      buildLandingGuidanceLabel({
        status: "ready",
        speed: 24,
        allowedSpeed: 42,
        angleError: 1,
        requiredAngleTolerance: 0.75
      })
    ).toBe("Soft dock");
  });

  it("gives slow off-angle ready contacts a dedicated soft tone", () => {
    expect(
      buildLandingGuidancePresentation({
        status: "ready",
        speed: 24,
        allowedSpeed: 42,
        angleError: 1,
        requiredAngleTolerance: 0.75
      })
    ).toEqual({
      label: "Soft dock",
      tone: "soft"
    });
  });

  it("keeps assist availability above ordinary landing guidance", () => {
    expect(buildLandingGuidanceLabel({ status: "too-fast", assistAvailable: true })).toBe("Assist ready");
  });
});
