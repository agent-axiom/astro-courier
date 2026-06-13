import { describe, expect, it } from "vitest";
import { landingPadVisual, objectiveBeaconPulse } from "./index";

describe("objective beacon pulse", () => {
  it("returns bounded radius and alpha values across the pulse cycle", () => {
    const samples = [0, 15, 30, 45, 60].map((tick) => objectiveBeaconPulse(tick));

    expect(samples.every((sample) => sample.radius >= 34 && sample.radius <= 50)).toBe(true);
    expect(samples.every((sample) => sample.alpha >= 0.18 && sample.alpha <= 0.72)).toBe(true);
    expect(new Set(samples.map((sample) => sample.radius)).size).toBeGreaterThan(1);
  });
});

describe("landing pad visual state", () => {
  it("makes the active objective and destination pads more legible than neutral pads", () => {
    const activePickup = landingPadVisual({ role: "pickup", active: true, destination: false });
    const destination = landingPadVisual({ role: "destination", active: false, destination: true });
    const neutral = landingPadVisual({ role: "neutral", active: false, destination: false });

    expect(activePickup).toMatchObject({
      color: 0x8ee6b8,
      strokeWidth: 4,
      haloAlpha: 0.18,
      beaconAlpha: 0.82
    });
    expect(destination.color).toBe(0xffd166);
    expect(destination.strokeWidth).toBeGreaterThan(neutral.strokeWidth);
    expect(destination.alpha).toBeGreaterThan(neutral.alpha);
    expect(neutral.haloAlpha).toBe(0);
  });
});
