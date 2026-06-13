import { describe, expect, it } from "vitest";
import { objectiveBeaconPulse } from "./index";

describe("objective beacon pulse", () => {
  it("returns bounded radius and alpha values across the pulse cycle", () => {
    const samples = [0, 15, 30, 45, 60].map((tick) => objectiveBeaconPulse(tick));

    expect(samples.every((sample) => sample.radius >= 34 && sample.radius <= 50)).toBe(true);
    expect(samples.every((sample) => sample.alpha >= 0.18 && sample.alpha <= 0.72)).toBe(true);
    expect(new Set(samples.map((sample) => sample.radius)).size).toBeGreaterThan(1);
  });
});
