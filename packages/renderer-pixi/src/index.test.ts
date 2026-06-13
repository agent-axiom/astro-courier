import { describe, expect, it } from "vitest";
import {
  boostBurstVisual,
  hazardFieldVisual,
  hazardVignetteEffect,
  landingPadVisual,
  objectiveBeaconPulse,
  objectiveGuidanceVisual,
  shipTrailVisual,
  trajectoryHazardDanger,
  trajectoryPointVisual
} from "./index";

describe("objective beacon pulse", () => {
  it("returns bounded radius and alpha values across the pulse cycle", () => {
    const samples = [0, 15, 30, 45, 60].map((tick) => objectiveBeaconPulse(tick));

    expect(samples.every((sample) => sample.radius >= 34 && sample.radius <= 50)).toBe(true);
    expect(samples.every((sample) => sample.alpha >= 0.18 && sample.alpha <= 0.72)).toBe(true);
    expect(new Set(samples.map((sample) => sample.radius)).size).toBeGreaterThan(1);
  });
});

describe("objective guidance visual", () => {
  it("makes close targets more assertive than distant route markers", () => {
    const far = objectiveGuidanceVisual({ distance: 900, landingStatus: "approach", assistAvailable: false });
    const close = objectiveGuidanceVisual({ distance: 80, landingStatus: "approach", assistAvailable: false });

    expect(close.lineAlpha).toBeGreaterThan(far.lineAlpha);
    expect(close.markerScale).toBeGreaterThan(far.markerScale);
    expect(close.edgeAlpha).toBeGreaterThan(far.edgeAlpha);
  });

  it("boosts ready assist guidance as a precision docking cue", () => {
    const approach = objectiveGuidanceVisual({ distance: 120, landingStatus: "approach", assistAvailable: false });
    const readyAssist = objectiveGuidanceVisual({ distance: 120, landingStatus: "ready", assistAvailable: true });

    expect(readyAssist.lineWidth).toBeGreaterThan(approach.lineWidth);
    expect(readyAssist.markerScale).toBeGreaterThan(approach.markerScale);
    expect(readyAssist.lineAlpha).toBeGreaterThan(approach.lineAlpha);
  });
});

describe("trajectory point visual", () => {
  it("stays hidden unless the run is actively flying", () => {
    expect(trajectoryPointVisual({ status: "paused", index: 0, total: 8 })).toBeUndefined();
    expect(trajectoryPointVisual({ status: "delivered", index: 0, total: 8 })).toBeUndefined();
  });

  it("makes the prediction endpoint more legible than early path dots", () => {
    const first = trajectoryPointVisual({ status: "flying", index: 0, total: 8 });
    const last = trajectoryPointVisual({ status: "flying", index: 7, total: 8 });

    expect(first).toMatchObject({ color: 0xf8e59a });
    expect(last).toMatchObject({ color: 0x7ce1ff });
    expect(last?.radius).toBeGreaterThan(first?.radius ?? 0);
    expect(last?.alpha).toBeGreaterThan(first?.alpha ?? 0);
  });

  it("escalates forecast dots that pass through hazard pressure", () => {
    const safe = trajectoryPointVisual({ status: "flying", index: 3, total: 8 });
    const near = trajectoryPointVisual({ status: "flying", index: 3, total: 8, danger: "near" });
    const inside = trajectoryPointVisual({ status: "flying", index: 3, total: 8, danger: "inside" });

    expect(near).toMatchObject({ color: 0xffd166 });
    expect(inside).toMatchObject({ color: 0xff4d6d });
    expect(near?.radius).toBeGreaterThan(safe?.radius ?? 0);
    expect(inside?.alpha).toBeGreaterThan(near?.alpha ?? 0);
  });
});

describe("trajectory hazard danger", () => {
  it("classifies forecast points against hazard radius and warning skirt", () => {
    const hazards = [
      {
        id: "training-asteroids",
        type: "asteroid_field",
        position: { x: 10, y: 0 },
        radius: 20,
        severity: 0.5
      }
    ];

    expect(trajectoryHazardDanger({ x: 12, y: 0 }, hazards)).toBe("inside");
    expect(trajectoryHazardDanger({ x: 40, y: 0 }, hazards)).toBe("near");
    expect(trajectoryHazardDanger({ x: 80, y: 0 }, hazards)).toBeUndefined();
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

describe("ship trail visual", () => {
  it("stays hidden when the ship is not actively moving in flight", () => {
    expect(shipTrailVisual({ status: "paused", speed: 32, fuelRatio: 0.8 })).toBeUndefined();
    expect(shipTrailVisual({ status: "flying", speed: 7.5, fuelRatio: 0.8 })).toBeUndefined();
  });

  it("scales trail length and radius with courier speed", () => {
    const cruise = shipTrailVisual({ status: "flying", speed: 14, fuelRatio: 0.8 });
    const sprint = shipTrailVisual({ status: "flying", speed: 46, fuelRatio: 0.8 });

    expect(cruise).toBeDefined();
    expect(sprint).toBeDefined();
    expect(sprint?.length).toBeGreaterThan(cruise?.length ?? 0);
    expect(sprint?.radius).toBeGreaterThan(cruise?.radius ?? 0);
    expect(sprint?.alpha).toBeLessThanOrEqual(0.72);
  });

  it("uses a warning trail when fuel is nearly gone", () => {
    expect(shipTrailVisual({ status: "flying", speed: 28, fuelRatio: 0.12 })).toMatchObject({
      color: 0xff4d6d
    });
  });

  it("switches clean high-speed reserve runs into a comet trail", () => {
    expect(shipTrailVisual({ status: "flying", speed: 48, fuelRatio: 0.82, cargoDamage: 0 })).toMatchObject({
      color: 0x7ce1ff,
      tone: "comet"
    });
  });

  it("keeps damaged high-speed runs on the ordinary sprint trail", () => {
    expect(shipTrailVisual({ status: "flying", speed: 48, fuelRatio: 0.82, cargoDamage: 0.08 })).toMatchObject({
      color: 0xff9f1c,
      tone: "sprint"
    });
  });
});

describe("boost burst visual", () => {
  it("stays hidden unless a boost burn milestone is active in flight", () => {
    expect(boostBurstVisual({ status: "paused", lastMilestone: "Boost Burn", tick: 12 })).toBeUndefined();
    expect(boostBurstVisual({ status: "flying", lastMilestone: "Clean Hazard Skim", tick: 12 })).toBeUndefined();
    expect(boostBurstVisual({ status: "flying", tick: 12 })).toBeUndefined();
  });

  it("returns a bounded pulsing shockwave for boost burns", () => {
    const early = boostBurstVisual({ status: "flying", lastMilestone: "Boost Burn", tick: 3 });
    const later = boostBurstVisual({ status: "flying", lastMilestone: "Boost Burn", tick: 18 });

    expect(early).toMatchObject({ color: 0x7ce1ff });
    expect(early?.radius).toBeGreaterThanOrEqual(22);
    expect(early?.radius).toBeLessThanOrEqual(44);
    expect(early?.alpha).toBeGreaterThanOrEqual(0.16);
    expect(early?.alpha).toBeLessThanOrEqual(0.48);
    expect(later?.radius).not.toBe(early?.radius);
  });
});
