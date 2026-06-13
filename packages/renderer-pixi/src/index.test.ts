import { describe, expect, it } from "vitest";
import { hazardFieldVisual, hazardVignetteEffect, landingPadVisual, objectiveBeaconPulse } from "./index";

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

describe("hazard vignette effect", () => {
  it("stays hidden outside flight or without a nearby hazard", () => {
    expect(hazardVignetteEffect({ status: "flying", nearestHazard: undefined })).toBeUndefined();
    expect(
      hazardVignetteEffect({
        status: "paused",
        nearestHazard: {
          id: "training-asteroids",
          type: "asteroid_field",
          position: { x: 0, y: 0 },
          distance: 80,
          radius: 70,
          severity: 0.2,
          dangerLevel: "near"
        }
      })
    ).toBeUndefined();
  });

  it("intensifies from a near hazard warning to an inside hazard warning", () => {
    const near = hazardVignetteEffect({
      status: "flying",
      nearestHazard: {
        id: "training-asteroids",
        type: "asteroid_field",
        position: { x: 0, y: 0 },
        distance: 118,
        radius: 70,
        severity: 0.2,
        dangerLevel: "near"
      }
    });
    const inside = hazardVignetteEffect({
      status: "flying",
      nearestHazard: {
        id: "training-asteroids",
        type: "asteroid_field",
        position: { x: 0, y: 0 },
        distance: 36,
        radius: 70,
        severity: 0.2,
        dangerLevel: "inside"
      }
    });

    expect(near).toMatchObject({ color: 0xffd166, width: 6 });
    expect(inside).toMatchObject({ color: 0xff4d6d, width: 10 });
    expect(inside?.alpha).toBeGreaterThan(near?.alpha ?? 0);
  });
});

describe("hazard field visual", () => {
  it("draws high severity fields with denser and stronger hazard marks", () => {
    const low = hazardFieldVisual({ severity: 0.2 });
    const high = hazardFieldVisual({ severity: 0.8 });

    expect(high.fillAlpha).toBeGreaterThan(low.fillAlpha);
    expect(high.strokeWidth).toBeGreaterThan(low.strokeWidth);
    expect(high.rockCount).toBeGreaterThan(low.rockCount);
  });
});
