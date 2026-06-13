import { describe, expect, it } from "vitest";
import { buildObjectiveDirective } from "./objective";

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
