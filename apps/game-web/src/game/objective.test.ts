import { describe, expect, it } from "vitest";
import { buildObjectiveDirective, buildObjectiveInterceptReadout } from "./objective";

describe("objective directive HUD copy", () => {
  it("points pickup phase at the pickup pad", () => {
    expect(
      buildObjectiveDirective({
        objectivePhase: "pickup",
        pickupLabel: "Luma North Pad",
        destinationLabel: "Tea Station Dock A"
      })
    ).toEqual({
      label: "Pickup",
      value: "Luma North Pad"
    });
  });

  it("points delivery phase at the destination pad", () => {
    expect(
      buildObjectiveDirective({
        objectivePhase: "delivery",
        pickupLabel: "Luma North Pad",
        destinationLabel: "Tea Station Dock A"
      })
    ).toEqual({
      label: "Deliver",
      value: "Tea Station Dock A"
    });
  });

  it("keeps wrong-pad feedback focused on the required pickup", () => {
    expect(
      buildObjectiveDirective({
        objectivePhase: "pickup",
        pickupLabel: "Luma North Pad",
        destinationLabel: "Tea Station Dock A",
        lastMilestone: "Pickup Required"
      })
    ).toEqual({
      label: "Pickup first",
      value: "Luma North Pad"
    });
  });
});

describe("objective intercept readout", () => {
  it("hides when there is no active target or the run is finished", () => {
    expect(buildObjectiveInterceptReadout({ status: "flying", speed: 12 })).toBeUndefined();
    expect(buildObjectiveInterceptReadout({ status: "delivered", targetDistance: 40, speed: 12 })).toBeUndefined();
    expect(buildObjectiveInterceptReadout({ status: "crashed", targetDistance: 40, speed: 12 })).toBeUndefined();
  });

  it("asks the player to build speed when the target is known but the ship is drifting", () => {
    expect(buildObjectiveInterceptReadout({ status: "flying", targetDistance: 140, speed: 0.4 })).toEqual({
      label: "Intercept",
      value: "Build speed",
      tone: "hold"
    });
  });

  it("formats a fast target intercept ETA", () => {
    expect(buildObjectiveInterceptReadout({ status: "flying", targetDistance: 72, speed: 12 })).toEqual({
      label: "Intercept",
      value: "ETA 6.0s",
      tone: "fast"
    });
  });

  it("marks long intercept lines as slow", () => {
    expect(buildObjectiveInterceptReadout({ status: "paused", targetDistance: 420, speed: 14 })).toEqual({
      label: "Intercept",
      value: "ETA 30.0s",
      tone: "slow"
    });
  });
});
