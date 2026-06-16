import { describe, expect, it } from "vitest";
import { buildTargetCompassPresentation, formatBearingGuidance } from "./bearing";

describe("objective bearing guidance", () => {
  it("turns relative bearing radians into compact direction labels", () => {
    expect(formatBearingGuidance(0.08)).toEqual({
      label: "Target ahead",
      value: "5deg",
      tone: "ahead"
    });
    expect(formatBearingGuidance(-0.7)).toEqual({
      label: "Target left",
      value: "40deg",
      tone: "side"
    });
    expect(formatBearingGuidance(0.85)).toEqual({
      label: "Target right",
      value: "49deg",
      tone: "side"
    });
    expect(formatBearingGuidance(Math.PI)).toEqual({
      label: "Turn around",
      value: "180deg",
      tone: "reverse"
    });
  });
});

describe("target compass presentation", () => {
  it("stays hidden outside active target navigation", () => {
    expect(
      buildTargetCompassPresentation({
        status: "paused",
        preflightOpen: true,
        objectivePhase: "pickup",
        targetDistance: 180,
        relativeBearing: 0.4
      })
    ).toBeUndefined();

    expect(
      buildTargetCompassPresentation({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "pickup",
        targetDistance: 180
      })
    ).toBeUndefined();
  });

  it("turns pickup bearing and range into one visual compass cue", () => {
    expect(
      buildTargetCompassPresentation({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "pickup",
        targetDistance: 196.8,
        relativeBearing: -0.7
      })
    ).toEqual({
      label: "Pickup",
      distance: "197m",
      tone: "pickup",
      angleDeg: -40,
      progress: 0.53
    });
  });

  it("switches final delivery contact into a ready compass tone", () => {
    expect(
      buildTargetCompassPresentation({
        status: "flying",
        preflightOpen: false,
        objectivePhase: "delivery",
        targetDistance: 42,
        relativeBearing: Math.PI / 2,
        landingStatus: "ready"
      })
    ).toEqual({
      label: "Dock",
      distance: "42m",
      tone: "ready",
      angleDeg: 90,
      progress: 0.9
    });
  });
});
