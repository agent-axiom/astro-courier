import { describe, expect, it } from "vitest";
import { forecastTrajectoryHazardRisk } from "./trajectoryRisk";

const hazards = [
  {
    id: "training-asteroids",
    type: "asteroid_field",
    position: { x: 0, y: 0 },
    radius: 10,
    severity: 0.6
  }
];

describe("trajectory hazard risk forecast", () => {
  it("stays hidden outside active flight", () => {
    expect(
      forecastTrajectoryHazardRisk({
        status: "paused",
        trajectory: [{ x: 0, y: 0 }],
        hazards,
        sampleIntervalSeconds: 0.1
      })
    ).toBeUndefined();
  });

  it("warns when the predicted route enters a hazard field", () => {
    expect(
      forecastTrajectoryHazardRisk({
        status: "flying",
        trajectory: [
          { x: -28, y: 0 },
          { x: -18, y: 0 },
          { x: -8, y: 0 }
        ],
        hazards,
        sampleIntervalSeconds: 0.1
      })
    ).toEqual({
      hazardId: "training-asteroids",
      level: "inside",
      seconds: 0.3,
      distance: 8,
      clearance: -2,
      radius: 10
    });
  });

  it("keeps a near-field skim forecast when the path stays outside the hazard core", () => {
    expect(
      forecastTrajectoryHazardRisk({
        status: "flying",
        trajectory: [
          { x: -28, y: 0 },
          { x: -14, y: 0 },
          { x: -13, y: 0 }
        ],
        hazards,
        sampleIntervalSeconds: 0.1
      })
    ).toEqual({
      hazardId: "training-asteroids",
      level: "near",
      seconds: 0.2,
      distance: 14,
      clearance: 4,
      radius: 10
    });
  });
});
