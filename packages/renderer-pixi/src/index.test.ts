import { describe, expect, it } from "vitest";
import {
  boostBurstVisual,
  boostSparkVisual,
  blackHoleVisual,
  cameraFocus,
  cameraZoom,
  combatShipVisual,
  cargoAuraVisual,
  cargoFractureVisual,
  enemyShipVisual,
  ghostTrailSegmentVisual,
  ghostTrailPointVisual,
  gravitySourceVisual,
  gravitySurfaceRimVisual,
  gravitySurfaceWarningVisual,
  gravitySlingCueVisual,
  hazardFieldVisual,
  hazardVignetteEffect,
  landingCorridorVisual,
  landingPadVisual,
  objectiveBeaconPulse,
  objectiveCourseBeaconVisual,
  objectiveGuidanceVisual,
  objectiveDockGateVisual,
  objectiveRouteBeamVisual,
  approachLockVisual,
  riskGateVisual,
  screenShakeOffset,
  projectileVisual,
  shipBoostReadinessVisual,
  shipBankVisual,
  shipShieldReserveVisual,
  shipStyleOrbitVisual,
  shipTrailVisual,
  speedLineVisual,
  trajectoryHazardDanger,
  trajectoryHazardMarkerVisual,
  trajectoryGravitySlingSignal,
  trajectoryPointVisual,
  trajectorySegmentVisual,
  velocityVectorVisual
} from "./index";

describe("camera focus", () => {
  it("stays centered on the ship outside active flight", () => {
    expect(
      cameraFocus({
        status: "paused",
        ship: { position: { x: 10, y: 20 }, velocity: { x: 40, y: 0 } }
      })
    ).toEqual({ x: 10, y: 20 });
  });

  it("leads the camera into a fast flight vector", () => {
    expect(
      cameraFocus({
        status: "flying",
        ship: { position: { x: 10, y: 20 }, velocity: { x: 40, y: 0 } }
      })
    ).toEqual({ x: 56, y: 20 });
  });

  it("damps camera lead during close docking precision", () => {
    const far = cameraFocus({
      status: "flying",
      ship: { position: { x: 10, y: 20 }, velocity: { x: 60, y: 0 } }
    });
    const close = cameraFocus({
      status: "flying",
      ship: { position: { x: 10, y: 20 }, velocity: { x: 60, y: 0 } },
      objectiveTarget: {
        id: "dock-a",
        role: "destination",
        position: { x: 0, y: 0 },
        distance: 48,
        bearing: 0,
        speed: 60,
        allowedApproachSpeed: 42,
        angleError: 0,
        requiredAngleTolerance: 0.3,
        assistAvailable: false,
        landingStatus: "ready"
      }
    });

    expect(far.x).toBeGreaterThan(close.x);
    expect(close.x).toBeGreaterThan(10);
  });
});

describe("combat visuals", () => {
  it("renders dry-fuel black holes as a compact singularity effect", () => {
    expect(blackHoleVisual({ status: "flying", tick: 12 })).toBeUndefined();
    expect(
      blackHoleVisual({
        status: "crashed",
        tick: 12,
        blackHole: {
          position: { x: 10, y: 20 },
          radius: 66,
          pullRadius: 170,
          intensity: 1
        }
      })
    ).toEqual({
      coreRadius: 66,
      pullRadius: 170,
      ringRadius: 82.8,
      coreColor: 0x02030a,
      ringColor: 0x9b5cff,
      haloColor: 0x101424,
      coreAlpha: 0.98,
      ringAlpha: 0.74,
      pullAlpha: 0.2,
      rotation: 1.2
    });
  });

  it("keeps the courier ship bright while showing HP pressure", () => {
    expect(combatShipVisual({ status: "flying", hp: 100, maxHp: 100 })).toEqual({
      bodyColor: 0xffb13b,
      canopyColor: 0x92f4ff,
      wingColor: 0xf7f0da,
      warningAlpha: 0,
      scale: 1
    });

    expect(combatShipVisual({ status: "flying", hp: 18, maxHp: 100 })).toMatchObject({
      bodyColor: 0xff8a3d,
      warningAlpha: 0.68
    });
  });

  it("distinguishes enemy policy tone without extra UI text", () => {
    expect(enemyShipVisual({ policy: "patrol", hp: 40, maxHp: 40 })).toMatchObject({
      color: 0xb36bff,
      beamColor: 0xff7ab6,
      alpha: 0.88
    });
    expect(enemyShipVisual({ policy: "evade", hp: 8, maxHp: 40 })).toMatchObject({
      color: 0xffd166,
      alpha: 0.55
    });
  });

  it("distinguishes enemy archetypes by silhouette, scale, and accent", () => {
    expect(enemyShipVisual({ archetype: "drone", policy: "chase", hp: 22, maxHp: 22 })).toMatchObject({
      archetype: "drone",
      silhouette: "dart",
      radius: 11,
      wingScale: 0.72,
      beamColor: 0x7ce1ff
    });
    expect(enemyShipVisual({ archetype: "fighter", policy: "chase", hp: 40, maxHp: 40 })).toMatchObject({
      archetype: "fighter",
      silhouette: "blade",
      radius: 16,
      wingScale: 0.9
    });
    expect(enemyShipVisual({ archetype: "brute", policy: "chase", hp: 78, maxHp: 78 })).toMatchObject({
      archetype: "brute",
      silhouette: "breaker",
      radius: 22,
      wingScale: 1.18,
      beamColor: 0xffd166
    });
    expect(enemyShipVisual({ archetype: "sentinel", policy: "chase", hp: 120, maxHp: 120 })).toMatchObject({
      archetype: "sentinel",
      silhouette: "sentinel",
      radius: 27,
      wingScale: 1.32,
      beamColor: 0x8ee6ff
    });
  });

  it("uses distinct projectile colors for player and enemy fire", () => {
    expect(projectileVisual({ owner: "player" })).toEqual({
      color: 0x7ce1ff,
      glowColor: 0xbff7ff,
      radius: 4,
      alpha: 0.9
    });
    expect(projectileVisual({ owner: "enemy" })).toEqual({
      color: 0xff6f91,
      glowColor: 0xffb3c7,
      radius: 5,
      alpha: 0.86
    });
  });
});

describe("camera zoom", () => {
  it("keeps preflight and slow flight at readable close range", () => {
    expect(cameraZoom({ status: "paused", ship: { velocity: { x: 90, y: 0 } } })).toBe(1);
    expect(cameraZoom({ status: "flying", ship: { velocity: { x: 12, y: 0 } } })).toBe(1);
  });

  it("pulls back during fast courier runs and eases back in near the target", () => {
    const openSpace = cameraZoom({ status: "flying", ship: { velocity: { x: 90, y: 0 } } });
    const nearDock = cameraZoom({
      status: "flying",
      ship: { velocity: { x: 90, y: 0 } },
      objectiveTarget: {
        id: "dock-a",
        role: "destination",
        position: { x: 0, y: 0 },
        distance: 44,
        bearing: 0,
        speed: 90,
        allowedApproachSpeed: 42,
        angleError: 0,
        requiredAngleTolerance: 0.3,
        assistAvailable: false,
        landingStatus: "too-fast"
      }
    });

    expect(openSpace).toBeLessThan(1);
    expect(openSpace).toBeGreaterThanOrEqual(0.82);
    expect(nearDock).toBeGreaterThan(openSpace);
    expect(nearDock).toBeLessThanOrEqual(1);
  });
});

describe("risk gate visual", () => {
  it("stays hidden after clear and brightens when the ship is fast enough", () => {
    expect(
      riskGateVisual({
        status: "flying",
        cleared: true,
        speed: 60,
        speedThreshold: 34,
        tick: 4
      })
    ).toBeUndefined();

    expect(
      riskGateVisual({
        status: "flying",
        cleared: false,
        speed: 24,
        speedThreshold: 34,
        tick: 4
      })
    ).toMatchObject({
      tone: "setup",
      color: 0x7ce1ff
    });

    expect(
      riskGateVisual({
        status: "flying",
        cleared: false,
        speed: 42,
        speedThreshold: 34,
        tick: 4
      })
    ).toMatchObject({
      tone: "ready",
      color: 0xffd166
    });
  });

  it("adds a lane cue for multi-gate route puzzles", () => {
    expect(
      riskGateVisual({
        status: "paused",
        cleared: false,
        speed: 26,
        speedThreshold: 34,
        sequenceIndex: 2,
        sequenceTotal: 5,
        tick: 12
      })
    ).toMatchObject({
      tone: "maze",
      laneAlpha: 0.3,
      laneWidth: 1.6,
      sequenceLabel: "3/5"
    });
  });
});

describe("screen shake offset", () => {
  it("stays still outside active flight", () => {
    expect(screenShakeOffset({ status: "paused", tick: 12 })).toEqual({ x: 0, y: 0 });
  });

  it("adds bounded impact motion for boost burns", () => {
    const shake = screenShakeOffset({ status: "flying", tick: 12, lastMilestone: "Boost Burn" });

    expect(Math.hypot(shake.x, shake.y)).toBeGreaterThan(0);
    expect(Math.abs(shake.x)).toBeLessThanOrEqual(4);
    expect(Math.abs(shake.y)).toBeLessThanOrEqual(4);
  });

  it("makes emergency shield rebounds feel stronger than assist correction", () => {
    const assist = screenShakeOffset({ status: "flying", tick: 12, lastMilestone: "Assist Burn" });
    const shield = screenShakeOffset({ status: "flying", tick: 12, lastMilestone: "Shield Rebound" });

    expect(Math.hypot(shield.x, shield.y)).toBeGreaterThan(Math.hypot(assist.x, assist.y));
    expect(Math.abs(shield.x)).toBeLessThanOrEqual(5);
    expect(Math.abs(shield.y)).toBeLessThanOrEqual(5);
  });

  it("makes inside hazard contact stronger than boost impact", () => {
    const boost = screenShakeOffset({ status: "flying", tick: 12, lastMilestone: "Boost Burn" });
    const hazard = screenShakeOffset({
      status: "flying",
      tick: 12,
      nearestHazard: {
        id: "training-asteroids",
        type: "asteroid_field",
        position: { x: 0, y: 0 },
        distance: 24,
        radius: 70,
        severity: 0.8,
        dangerLevel: "inside"
      }
    });

    expect(Math.hypot(hazard.x, hazard.y)).toBeGreaterThan(Math.hypot(boost.x, boost.y));
  });
});

describe("speed line visual", () => {
  it("stays hidden in menus and low-speed flight", () => {
    expect(speedLineVisual({ status: "paused", velocity: { x: 90, y: 0 }, tick: 12 })).toBeUndefined();
    expect(speedLineVisual({ status: "flying", velocity: { x: 18, y: 0 }, tick: 12 })).toBeUndefined();
  });

  it("adds denser longer streaks as courier speed climbs", () => {
    const sprint = speedLineVisual({ status: "flying", velocity: { x: 42, y: 0 }, tick: 8 });
    const warp = speedLineVisual({ status: "flying", velocity: { x: 92, y: 0 }, tick: 8 });

    expect(sprint).toMatchObject({
      angle: 0,
      color: 0x7ce1ff,
      tone: "sprint"
    });
    expect(sprint?.count).toBeGreaterThanOrEqual(8);
    expect(warp).toMatchObject({
      color: 0xbff7ff,
      tone: "warp"
    });
    expect(warp?.count).toBeGreaterThan(sprint?.count ?? 0);
    expect(warp?.length).toBeGreaterThan(sprint?.length ?? 0);
    expect(warp?.alpha).toBeGreaterThan(sprint?.alpha ?? 0);
  });
});

describe("objective beacon pulse", () => {
  it("returns bounded radius and alpha values across the pulse cycle", () => {
    const samples = [0, 15, 30, 45, 60].map((tick) => objectiveBeaconPulse(tick));

    expect(samples.every((sample) => sample.radius >= 34 && sample.radius <= 50)).toBe(true);
    expect(samples.every((sample) => sample.alpha >= 0.18 && sample.alpha <= 0.72)).toBe(true);
    expect(new Set(samples.map((sample) => sample.radius)).size).toBeGreaterThan(1);
  });
});

describe("objective course beacon visual", () => {
  it("stays hidden outside active route flight", () => {
    expect(
      objectiveCourseBeaconVisual({
        status: "paused",
        objectivePhase: "pickup",
        distance: 120,
        landingStatus: "approach",
        assistAvailable: false,
        tick: 4
      })
    ).toBeUndefined();
    expect(
      objectiveCourseBeaconVisual({
        status: "flying",
        objectivePhase: "complete",
        distance: 24,
        landingStatus: "ready",
        assistAvailable: false,
        tick: 4
      })
    ).toBeUndefined();
  });

  it("uses compact tone and scale to distinguish pickup, delivery, and unsafe docks", () => {
    const pickup = objectiveCourseBeaconVisual({
      status: "flying",
      objectivePhase: "pickup",
      distance: 360,
      landingStatus: "approach",
      assistAvailable: false,
      tick: 8
    });
    const delivery = objectiveCourseBeaconVisual({
      status: "flying",
      objectivePhase: "delivery",
      distance: 120,
      landingStatus: "approach",
      assistAvailable: false,
      tick: 8
    });
    const warning = objectiveCourseBeaconVisual({
      status: "flying",
      objectivePhase: "delivery",
      distance: 48,
      landingStatus: "too-fast",
      assistAvailable: false,
      tick: 8
    });

    expect(pickup).toMatchObject({ color: 0x8ee6b8, tone: "pickup" });
    expect(delivery).toMatchObject({ color: 0xffd166, tone: "delivery" });
    expect(warning).toMatchObject({ color: 0xff6f91, tone: "warning" });
    expect(delivery?.outerRadius).toBeGreaterThan(pickup?.outerRadius ?? 0);
    expect(warning?.sweepAlpha).toBeGreaterThan(delivery?.sweepAlpha ?? 0);
  });

  it("animates a stable beacon flow while stronger ready docks stay readable", () => {
    const early = objectiveCourseBeaconVisual({
      status: "flying",
      objectivePhase: "delivery",
      distance: 42,
      landingStatus: "ready",
      assistAvailable: false,
      tick: 2
    });
    const later = objectiveCourseBeaconVisual({
      status: "flying",
      objectivePhase: "delivery",
      distance: 42,
      landingStatus: "ready",
      assistAvailable: false,
      tick: 18
    });

    expect(early).toMatchObject({ color: 0x8ee6b8, tone: "ready" });
    expect(early?.alpha).toBeGreaterThanOrEqual(0.54);
    expect(early?.flow).toBeGreaterThanOrEqual(0);
    expect(early?.flow).toBeLessThan(1);
    expect(later?.flow).not.toBe(early?.flow);
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

  it("makes ready docking markers read as a stronger visual lock", () => {
    const approach = objectiveGuidanceVisual({ distance: 72, landingStatus: "approach", assistAvailable: false });
    const ready = objectiveGuidanceVisual({ distance: 72, landingStatus: "ready", assistAvailable: false });

    expect(ready.markerScale).toBeGreaterThanOrEqual(1.32);
    expect(ready.markerScale).toBeGreaterThan(approach.markerScale + 0.12);
    expect(ready.edgeAlpha).toBeGreaterThanOrEqual(0.94);
  });
});

describe("objective dock gate visual", () => {
  it("stays hidden until a destination dock state needs a strong close-range cue", () => {
    expect(
      objectiveDockGateVisual({
        status: "paused",
        objectivePhase: "delivery",
        distance: 48,
        landingStatus: "ready",
        assistAvailable: false
      })
    ).toBeUndefined();
    expect(
      objectiveDockGateVisual({
        status: "flying",
        objectivePhase: "pickup",
        distance: 48,
        landingStatus: "ready",
        assistAvailable: false
      })
    ).toBeUndefined();
    expect(
      objectiveDockGateVisual({
        status: "flying",
        objectivePhase: "delivery",
        distance: 150,
        landingStatus: "approach",
        assistAvailable: false
      })
    ).toBeUndefined();
  });

  it("turns ready delivery targets into an open dock gate", () => {
    expect(
      objectiveDockGateVisual({
        status: "flying",
        objectivePhase: "delivery",
        distance: 42,
        landingStatus: "ready",
        assistAvailable: false
      })
    ).toEqual({
      color: 0x8ee6b8,
      tone: "open",
      alpha: 0.76,
      radius: 46,
      width: 3,
      segments: 3
    });
  });

  it("makes assist and unsafe close targets visually distinct", () => {
    expect(
      objectiveDockGateVisual({
        status: "flying",
        objectivePhase: "delivery",
        distance: 34,
        landingStatus: "ready",
        assistAvailable: true
      })
    ).toMatchObject({
      color: 0x7ce1ff,
      tone: "assist",
      width: 3.4
    });

    expect(
      objectiveDockGateVisual({
        status: "flying",
        objectivePhase: "delivery",
        distance: 34,
        landingStatus: "too-fast",
        assistAvailable: false
      })
    ).toMatchObject({
      color: 0xff6f91,
      tone: "brake",
      segments: 6
    });

    expect(
      objectiveDockGateVisual({
        status: "flying",
        objectivePhase: "delivery",
        distance: 34,
        landingStatus: "misaligned",
        assistAvailable: false
      })
    ).toMatchObject({
      color: 0xffd166,
      tone: "align",
      segments: 4
    });
  });
});

describe("objective route beam visual", () => {
  it("stays hidden outside active route flight", () => {
    expect(
      objectiveRouteBeamVisual({
        status: "paused",
        objectivePhase: "pickup",
        distance: 180,
        landingStatus: "approach",
        assistAvailable: false,
        tick: 12
      })
    ).toBeUndefined();
    expect(
      objectiveRouteBeamVisual({
        status: "flying",
        objectivePhase: "complete",
        distance: 12,
        landingStatus: "ready",
        assistAvailable: false,
        tick: 12
      })
    ).toBeUndefined();
  });

  it("makes nearby route beams more readable than distant route beams", () => {
    const far = objectiveRouteBeamVisual({
      status: "flying",
      objectivePhase: "pickup",
      distance: 720,
      landingStatus: "approach",
      assistAvailable: false,
      tick: 8
    });
    const close = objectiveRouteBeamVisual({
      status: "flying",
      objectivePhase: "pickup",
      distance: 80,
      landingStatus: "approach",
      assistAvailable: false,
      tick: 8
    });

    expect(far).toMatchObject({ color: 0x8ee6b8, tone: "pickup" });
    expect(close?.alpha).toBeGreaterThan(far?.alpha ?? 0);
    expect(close?.width).toBeGreaterThan(far?.width ?? 0);
    expect(close?.nodeRadius).toBeGreaterThan(far?.nodeRadius ?? 0);
  });

  it("uses tone and motion to make delivery guidance readable without text", () => {
    const delivery = objectiveRouteBeamVisual({
      status: "flying",
      objectivePhase: "delivery",
      distance: 210,
      landingStatus: "approach",
      assistAvailable: false,
      tick: 4
    });
    const ready = objectiveRouteBeamVisual({
      status: "flying",
      objectivePhase: "delivery",
      distance: 42,
      landingStatus: "ready",
      assistAvailable: false,
      tick: 4
    });
    const warning = objectiveRouteBeamVisual({
      status: "flying",
      objectivePhase: "delivery",
      distance: 42,
      landingStatus: "too-fast",
      assistAvailable: false,
      tick: 4
    });

    expect(delivery).toMatchObject({ color: 0xffd166, tone: "delivery" });
    expect(ready).toMatchObject({ color: 0x8ee6b8, tone: "ready" });
    expect(warning).toMatchObject({ color: 0xff6f91, tone: "warning" });
    expect(ready?.alpha).toBeGreaterThan(delivery?.alpha ?? 0);
    expect(warning?.width).toBeGreaterThan(delivery?.width ?? 0);
  });

  it("animates beam nodes with a stable wrapped flow value", () => {
    const early = objectiveRouteBeamVisual({
      status: "flying",
      objectivePhase: "pickup",
      distance: 160,
      landingStatus: "approach",
      assistAvailable: false,
      tick: 2
    });
    const later = objectiveRouteBeamVisual({
      status: "flying",
      objectivePhase: "pickup",
      distance: 160,
      landingStatus: "approach",
      assistAvailable: false,
      tick: 17
    });

    expect(early?.nodes).toBeGreaterThanOrEqual(3);
    expect(early?.flow).toBeGreaterThanOrEqual(0);
    expect(early?.flow).toBeLessThan(1);
    expect(later?.flow).not.toBe(early?.flow);
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

  it("highlights forecast dots that cross the gravity sling pocket", () => {
    const safe = trajectoryPointVisual({ status: "flying", index: 3, total: 8 });
    const setup = trajectoryPointVisual({ status: "flying", index: 3, total: 8, sling: "setup" });
    const ready = trajectoryPointVisual({ status: "flying", index: 3, total: 8, sling: "ready" });

    expect(setup).toMatchObject({ color: 0x7ce1ff });
    expect(ready).toMatchObject({ color: 0xf8e59a });
    expect(setup?.radius).toBeGreaterThan(safe?.radius ?? 0);
    expect(ready?.radius).toBeGreaterThan(setup?.radius ?? 0);
    expect(ready?.alpha).toBeGreaterThan(setup?.alpha ?? 0);
  });
});

describe("trajectory segment visual", () => {
  it("stays hidden outside active flight or without enough points", () => {
    expect(trajectorySegmentVisual({ status: "paused", index: 1, total: 5 })).toBeUndefined();
    expect(trajectorySegmentVisual({ status: "flying", index: 0, total: 1 })).toBeUndefined();
  });

  it("renders safe prediction segments as subtle guide lines", () => {
    const early = trajectorySegmentVisual({ status: "flying", index: 1, total: 6 });
    const late = trajectorySegmentVisual({ status: "flying", index: 5, total: 6 });

    expect(early).toMatchObject({ color: 0xf8e59a, tone: "safe" });
    expect(late).toMatchObject({ color: 0x7ce1ff, tone: "safe" });
    expect(late?.alpha).toBeGreaterThan(early?.alpha ?? 0);
    expect(late?.width).toBeGreaterThanOrEqual(early?.width ?? 0);
  });

  it("escalates trajectory segments through hazard pressure", () => {
    const safe = trajectorySegmentVisual({ status: "flying", index: 3, total: 6 });
    const near = trajectorySegmentVisual({ status: "flying", index: 3, total: 6, danger: "near" });
    const inside = trajectorySegmentVisual({ status: "flying", index: 3, total: 6, danger: "inside" });

    expect(near).toMatchObject({ color: 0xffd166, tone: "near" });
    expect(inside).toMatchObject({ color: 0xff4d6d, tone: "inside" });
    expect(near?.width).toBeGreaterThan(safe?.width ?? 0);
    expect(inside?.alpha).toBeGreaterThan(near?.alpha ?? 0);
  });

  it("highlights gravity sling forecast segments", () => {
    const safe = trajectorySegmentVisual({ status: "flying", index: 3, total: 6 });
    const setup = trajectorySegmentVisual({ status: "flying", index: 3, total: 6, sling: "setup" });
    const ready = trajectorySegmentVisual({ status: "flying", index: 3, total: 6, sling: "ready" });

    expect(setup).toMatchObject({ color: 0x7ce1ff, tone: "sling-setup" });
    expect(ready).toMatchObject({ color: 0xf8e59a, tone: "sling-ready" });
    expect(setup?.width).toBeGreaterThan(safe?.width ?? 0);
    expect(ready?.alpha).toBeGreaterThan(setup?.alpha ?? 0);
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

describe("trajectory hazard marker visual", () => {
  const hazards = [
    {
      id: "training-asteroids",
      type: "asteroid_field",
      position: { x: 50, y: 0 },
      radius: 20,
      severity: 0.7
    }
  ];

  it("stays hidden outside active flight or without projected hazard pressure", () => {
    expect(
      trajectoryHazardMarkerVisual({
        status: "paused",
        trajectory: [
          { x: 0, y: 0 },
          { x: 48, y: 0 }
        ],
        hazards
      })
    ).toBeUndefined();
    expect(
      trajectoryHazardMarkerVisual({
        status: "flying",
        trajectory: [{ x: 0, y: 0 }],
        hazards
      })
    ).toBeUndefined();
  });

  it("marks the first projected danger point with severity-weighted warning rings", () => {
    const near = trajectoryHazardMarkerVisual({
      status: "flying",
      trajectory: [
        { x: 0, y: 0 },
        { x: 78, y: 0 },
        { x: 51, y: 0 }
      ],
      hazards
    });
    const inside = trajectoryHazardMarkerVisual({
      status: "flying",
      trajectory: [
        { x: 0, y: 0 },
        { x: 51, y: 0 }
      ],
      hazards
    });

    expect(near).toMatchObject({ index: 1, tone: "near", color: 0xffd166 });
    expect(inside).toMatchObject({ index: 1, tone: "inside", color: 0xff4d6d });
    expect(inside?.radius).toBeGreaterThan(near?.radius ?? 0);
    expect(inside?.alpha).toBeGreaterThan(near?.alpha ?? 0);
    expect(near?.width).toBeGreaterThan(1);
  });
});

describe("trajectory gravity sling signal", () => {
  const gravitySources = [
    {
      id: "luma",
      name: "Luma",
      visualTheme: "blue_garden",
      position: { x: 0, y: 0 },
      radius: 64,
      influenceRadius: 360
    }
  ];

  it("classifies forecast points inside the sling pocket but away from the surface", () => {
    expect(trajectoryGravitySlingSignal({ x: 0, y: -160 }, gravitySources)).toBe("setup");
    expect(
      trajectoryGravitySlingSignal(
        { x: 0, y: -160 },
        gravitySources,
        {
          id: "luma",
          name: "Luma",
          distance: 160,
          ready: true,
          speedThreshold: 54,
          styleBonus: 240
        }
      )
    ).toBe("ready");
  });

  it("ignores near-surface and outside-influence forecast points", () => {
    expect(trajectoryGravitySlingSignal({ x: 0, y: -74 }, gravitySources)).toBeUndefined();
    expect(trajectoryGravitySlingSignal({ x: 0, y: -260 }, gravitySources)).toBeUndefined();
  });
});

describe("ghost trail point visual", () => {
  it("stays hidden without enough samples or after terminal results own the screen", () => {
    expect(ghostTrailPointVisual({ status: "flying", index: 0, total: 1 })).toBeUndefined();
    expect(ghostTrailPointVisual({ status: "delivered", index: 0, total: 4 })).toBeUndefined();
    expect(ghostTrailPointVisual({ status: "crashed", index: 0, total: 4 })).toBeUndefined();
  });

  it("renders saved route ghosts during preflight and active flight", () => {
    const first = ghostTrailPointVisual({ status: "paused", index: 0, total: 5 });
    const last = ghostTrailPointVisual({ status: "flying", index: 4, total: 5 });

    expect(first).toMatchObject({ color: 0x8ee6b8, radius: 2.4 });
    expect(last).toMatchObject({ color: 0xf8e59a });
    expect(last?.radius).toBeGreaterThan(first?.radius ?? 0);
    expect(last?.alpha).toBeGreaterThan(first?.alpha ?? 0);
  });
});

describe("ghost trail segment visual", () => {
  it("stays hidden without enough samples or after terminal results own the screen", () => {
    expect(ghostTrailSegmentVisual({ status: "flying", index: 0, total: 1, tick: 12 })).toBeUndefined();
    expect(ghostTrailSegmentVisual({ status: "delivered", index: 1, total: 5, tick: 12 })).toBeUndefined();
    expect(ghostTrailSegmentVisual({ status: "crashed", index: 1, total: 5, tick: 12 })).toBeUndefined();
  });

  it("renders active ghost segments brighter than preflight route ghosts", () => {
    const preflight = ghostTrailSegmentVisual({ status: "paused", index: 1, total: 5, tick: 12 });
    const active = ghostTrailSegmentVisual({ status: "flying", index: 1, total: 5, tick: 12 });
    const late = ghostTrailSegmentVisual({ status: "flying", index: 4, total: 5, tick: 12 });

    expect(preflight).toMatchObject({ color: 0x8ee6b8, width: 1.3 });
    expect(active).toMatchObject({ color: 0x8ee6b8 });
    expect(active?.width).toBeGreaterThan(preflight?.width ?? 0);
    expect(active?.alpha).toBeGreaterThan(preflight?.alpha ?? 0);
    expect(late?.alpha).toBeGreaterThan(active?.alpha ?? 0);
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
      haloRadiusMultiplier: 3.5,
      beaconAlpha: 0.82
    });
    expect(destination.color).toBe(0xffd166);
    expect(destination.haloRadiusMultiplier).toBeGreaterThan(1);
    expect(destination.strokeWidth).toBeGreaterThan(neutral.strokeWidth);
    expect(destination.alpha).toBeGreaterThan(neutral.alpha);
    expect(neutral.haloAlpha).toBe(0);
  });
});

describe("landing corridor visual", () => {
  it("stays hidden for inactive pads or terminal run screens", () => {
    expect(
      landingCorridorVisual({
        status: "flying",
        active: false,
        distance: 80,
        landingStatus: "approach",
        assistAvailable: false
      })
    ).toBeUndefined();
    expect(
      landingCorridorVisual({
        status: "delivered",
        active: true,
        distance: 20,
        landingStatus: "ready",
        assistAvailable: true
      })
    ).toBeUndefined();
  });

  it("uses status color and grows clearer near the docking pad", () => {
    const far = landingCorridorVisual({
      status: "flying",
      active: true,
      distance: 220,
      landingStatus: "approach",
      assistAvailable: false
    });
    const ready = landingCorridorVisual({
      status: "flying",
      active: true,
      distance: 26,
      landingStatus: "ready",
      assistAvailable: true
    });

    expect(far).toMatchObject({ color: 0xa0c4ff, tone: "approach" });
    expect(ready).toMatchObject({ color: 0x7ce1ff, tone: "assist" });
    expect(ready?.alpha).toBeGreaterThan(far?.alpha ?? 0);
    expect(ready?.width).toBeGreaterThan(far?.width ?? 0);
    expect(ready?.length).toBeGreaterThan(far?.length ?? 0);
  });

  it("marks unsafe docking statuses with warning colors", () => {
    const approach = landingCorridorVisual({
      status: "flying",
      active: true,
      distance: 32,
      landingStatus: "approach",
      assistAvailable: false
    });
    const tooFast = landingCorridorVisual({
      status: "flying",
      active: true,
      distance: 32,
      landingStatus: "too-fast",
      assistAvailable: false
    });
    const misaligned = landingCorridorVisual({
      status: "flying",
      active: true,
      distance: 32,
      landingStatus: "misaligned",
      assistAvailable: false
    });

    expect(tooFast).toMatchObject({ color: 0xff6f91, tone: "too-fast" });
    expect(misaligned).toMatchObject({ color: 0xffd166, tone: "misaligned" });
    expect(tooFast?.width).toBeGreaterThan(approach?.width ?? 0);
    expect(tooFast?.alpha).toBeGreaterThan(approach?.alpha ?? 0);
    expect(misaligned?.width).toBeGreaterThan(approach?.width ?? 0);
  });
});

describe("approach lock visual", () => {
  it("stays hidden unless a clean delivery dock is charging", () => {
    expect(
      approachLockVisual({
        status: "paused",
        objectivePhase: "delivery",
        objectiveTarget: {
          role: "destination",
          landingStatus: "ready",
          distance: 24
        },
        cargoDamage: 0,
        approachStreakSeconds: 0.6
      })
    ).toBeUndefined();
    expect(
      approachLockVisual({
        status: "flying",
        objectivePhase: "pickup",
        objectiveTarget: {
          role: "pickup",
          landingStatus: "ready",
          distance: 24
        },
        cargoDamage: 0,
        approachStreakSeconds: 0.6
      })
    ).toBeUndefined();
    expect(
      approachLockVisual({
        status: "flying",
        objectivePhase: "delivery",
        objectiveTarget: {
          role: "destination",
          landingStatus: "too-fast",
          distance: 24
        },
        cargoDamage: 0,
        approachStreakSeconds: 0.6
      })
    ).toBeUndefined();
    expect(
      approachLockVisual({
        status: "flying",
        objectivePhase: "delivery",
        objectiveTarget: {
          role: "destination",
          landingStatus: "ready",
          distance: 24
        },
        cargoDamage: 0.08,
        approachStreakSeconds: 0.6
      })
    ).toBeUndefined();
    expect(
      approachLockVisual({
        status: "flying",
        objectivePhase: "delivery",
        objectiveTarget: {
          role: "destination",
          landingStatus: "ready",
          distance: 24
        },
        cargoDamage: 0,
        approachStreakSeconds: 0.1
      })
    ).toBeUndefined();
  });

  it("charges from setup to armed as the clean ready approach is held", () => {
    const charging = approachLockVisual({
      status: "flying",
      objectivePhase: "delivery",
      objectiveTarget: {
        role: "destination",
        landingStatus: "ready",
        distance: 24
      },
      cargoDamage: 0,
      approachStreakSeconds: 0.45
    });
    const armed = approachLockVisual({
      status: "flying",
      objectivePhase: "delivery",
      objectiveTarget: {
        role: "destination",
        landingStatus: "ready",
        distance: 24
      },
      cargoDamage: 0,
      approachStreakSeconds: 1.2
    });

    expect(charging).toMatchObject({ color: 0x8ee6b8, tone: "charging", progress: 0.45 });
    expect(armed).toMatchObject({ color: 0xf8e59a, tone: "armed", progress: 1 });
    expect(armed?.alpha).toBeGreaterThan(charging?.alpha ?? 0);
    expect(armed?.width).toBeGreaterThan(charging?.width ?? 0);
    expect(armed?.radius).toBeGreaterThan(charging?.radius ?? 0);
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

describe("gravity sling cue visual", () => {
  it("stays hidden outside active flight or without a sling opportunity", () => {
    expect(gravitySlingCueVisual({ status: "paused" })).toBeUndefined();
    expect(gravitySlingCueVisual({ status: "flying" })).toBeUndefined();
  });

  it("makes ready sling windows more assertive than setup windows", () => {
    const setup = gravitySlingCueVisual({
      status: "flying",
      gravitySlingOpportunity: {
        id: "luma",
        name: "Luma",
        distance: 160,
        ready: false,
        speedThreshold: 54,
        styleBonus: 240
      },
      tick: 12
    });
    const ready = gravitySlingCueVisual({
      status: "flying",
      gravitySlingOpportunity: {
        id: "luma",
        name: "Luma",
        distance: 160,
        ready: true,
        speedThreshold: 54,
        styleBonus: 240
      },
      tick: 12
    });

    expect(setup).toMatchObject({ color: 0x7ce1ff, tone: "setup" });
    expect(ready).toMatchObject({ color: 0xf8e59a, tone: "ready" });
    expect(ready?.width).toBeGreaterThan(setup?.width ?? 0);
    expect(ready?.alpha).toBeGreaterThan(setup?.alpha ?? 0);
    expect(ready?.dashRadius).toBeGreaterThan(setup?.dashRadius ?? 0);
  });
});

describe("gravity source visual", () => {
  it("uses a black-metal palette for artificial capture planets", () => {
    expect(gravitySourceVisual("black_metal")).toEqual({
      haloColor: 0x171923,
      bodyColor: 0x05070c,
      highlightColor: 0x8ee6ff,
      rimColor: 0xd7fbff,
      craterColor: 0x2b2f3a,
      haloAlpha: 0.72,
      highlightAlpha: 0.22
    });
  });
});

describe("gravity surface rim visual", () => {
  it("draws a precise readable rim on the real gravity collision radius during flight", () => {
    expect(gravitySurfaceRimVisual({ status: "flying" })).toEqual({
      color: 0xd7fbff,
      alpha: 0.34,
      width: 1.5
    });
  });

  it("keeps the rim quieter outside active flight", () => {
    expect(gravitySurfaceRimVisual({ status: "paused" })).toEqual({
      color: 0xd7fbff,
      alpha: 0.18,
      width: 1
    });
  });
});

describe("gravity surface warning visual", () => {
  it("stays hidden away from active flight or outside the surface warning band", () => {
    expect(gravitySurfaceWarningVisual({ status: "paused", distance: 100, radius: 80, tick: 0 })).toBeUndefined();
    expect(gravitySurfaceWarningVisual({ status: "flying", distance: 170, radius: 80, tick: 0 })).toBeUndefined();
  });

  it("marks the true gravity collision edge before hull contact", () => {
    const near = gravitySurfaceWarningVisual({ status: "flying", distance: 118, radius: 80, tick: 0 });
    const inside = gravitySurfaceWarningVisual({ status: "flying", distance: 72, radius: 80, tick: 0 });

    expect(near).toMatchObject({ color: 0xffd166, tone: "near" });
    expect(inside).toMatchObject({ color: 0xff4d6d, tone: "inside" });
    expect(inside?.alpha).toBeGreaterThan(near?.alpha ?? 0);
    expect(inside?.width).toBeGreaterThan(near?.width ?? 0);
    expect(near?.radiusOffset).toBeGreaterThan(0);
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

  it("switches active style chains into a brighter chain trail", () => {
    const sprint = shipTrailVisual({ status: "flying", speed: 34, fuelRatio: 0.72, cargoDamage: 0 });
    const chain = shipTrailVisual({
      status: "flying",
      speed: 34,
      fuelRatio: 0.72,
      cargoDamage: 0,
      styleMultiplier: 1.5,
      styleChainSecondsRemaining: 2.4
    });

    expect(chain).toMatchObject({ color: 0x8ee6b8, tone: "chain" });
    expect(chain?.length).toBeGreaterThan(sprint?.length ?? 0);
    expect(chain?.alpha).toBeGreaterThan(sprint?.alpha ?? 0);
  });

  it("keeps low fuel warning trails above style chain trails", () => {
    expect(
      shipTrailVisual({
        status: "flying",
        speed: 34,
        fuelRatio: 0.12,
        styleMultiplier: 1.5,
        styleChainSecondsRemaining: 2.4
      })
    ).toMatchObject({
      color: 0xff4d6d,
      tone: "warning"
    });
  });
});

describe("ship bank visual", () => {
  it("keeps the hull neutral outside flight or while moving straight ahead", () => {
    expect(shipBankVisual({ status: "paused", rotation: 0, velocity: { x: 0, y: 42 } })).toEqual({
      alpha: 0,
      bank: 0,
      highlightSide: "neutral",
      leftWingScale: 1,
      rightWingScale: 1
    });
    expect(shipBankVisual({ status: "flying", rotation: 0, velocity: { x: 42, y: 0 } })).toMatchObject({
      bank: 0,
      highlightSide: "neutral"
    });
  });

  it("leans into lateral drift so fast turns feel more physical", () => {
    const rightDrift = shipBankVisual({ status: "flying", rotation: 0, velocity: { x: 26, y: 28 } });
    const leftDrift = shipBankVisual({ status: "flying", rotation: 0, velocity: { x: 26, y: -28 } });

    expect(rightDrift.bank).toBeGreaterThan(0);
    expect(rightDrift.highlightSide).toBe("right");
    expect(rightDrift.rightWingScale).toBeGreaterThan(rightDrift.leftWingScale);
    expect(rightDrift.alpha).toBeGreaterThan(0);
    expect(leftDrift.bank).toBeLessThan(0);
    expect(leftDrift.highlightSide).toBe("left");
    expect(leftDrift.leftWingScale).toBeGreaterThan(leftDrift.rightWingScale);
  });
});

describe("ship style orbit visual", () => {
  it("stays hidden unless a style chain is actively ticking during flight", () => {
    expect(
      shipStyleOrbitVisual({
        status: "paused",
        styleMultiplier: 1.5,
        styleChainCount: 2,
        styleChainSecondsRemaining: 2.4,
        tick: 8
      })
    ).toBeUndefined();
    expect(
      shipStyleOrbitVisual({
        status: "flying",
        styleMultiplier: 1,
        styleChainCount: 2,
        styleChainSecondsRemaining: 2.4,
        tick: 8
      })
    ).toBeUndefined();
    expect(
      shipStyleOrbitVisual({
        status: "flying",
        styleMultiplier: 1.5,
        styleChainCount: 2,
        styleChainSecondsRemaining: 0,
        tick: 8
      })
    ).toBeUndefined();
  });

  it("turns active chain count into orbit pips around the ship", () => {
    const visual = shipStyleOrbitVisual({
      status: "flying",
      styleMultiplier: 1.75,
      styleChainCount: 3,
      styleChainSecondsRemaining: 2.8,
      tick: 8
    });

    expect(visual).toMatchObject({
      color: 0x8ee6b8,
      tone: "chain",
      pips: 4,
      activePips: 3
    });
    expect(visual?.radius).toBeGreaterThan(30);
    expect(visual?.progress).toBeGreaterThan(0.5);
    expect(visual?.flow).toBeGreaterThanOrEqual(0);
    expect(visual?.flow).toBeLessThan(1);
  });

  it("warns visually when the style chain is about to expire", () => {
    const steady = shipStyleOrbitVisual({
      status: "flying",
      styleMultiplier: 1.5,
      styleChainCount: 2,
      styleChainSecondsRemaining: 2.4,
      tick: 10
    });
    const urgent = shipStyleOrbitVisual({
      status: "flying",
      styleMultiplier: 1.5,
      styleChainCount: 2,
      styleChainSecondsRemaining: 0.7,
      tick: 10
    });

    expect(urgent).toMatchObject({ color: 0xffd166, tone: "urgent" });
    expect(urgent?.alpha).toBeGreaterThan(steady?.alpha ?? 0);
    expect(urgent?.progress).toBeLessThan(steady?.progress ?? 1);
  });
});

describe("ship boost readiness visual", () => {
  it("stays hidden outside active flight or when fuel is too dry to boost", () => {
    expect(shipBoostReadinessVisual({ status: "paused", fuel: 100, boostCooldownSeconds: 0 })).toBeUndefined();
    expect(shipBoostReadinessVisual({ status: "flying", fuel: 2, boostCooldownSeconds: 0 })).toBeUndefined();
  });

  it("shows a ready boost halo once cooldown is clear", () => {
    expect(shipBoostReadinessVisual({ status: "flying", fuel: 48, boostCooldownSeconds: 0 })).toEqual({
      color: 0x7ce1ff,
      tone: "ready",
      radius: 28,
      width: 1.8,
      alpha: 0.34,
      progress: 1,
      segments: 8
    });
  });

  it("turns cooldown into a partial recharge ring", () => {
    expect(shipBoostReadinessVisual({ status: "flying", fuel: 48, boostCooldownSeconds: 0.575 })).toEqual({
      color: 0xa0c4ff,
      tone: "cooldown",
      radius: 26,
      width: 1.4,
      alpha: 0.24,
      progress: 0.5,
      segments: 4
    });
  });

  it("makes launch burst boost readiness feel urgent and rewarding", () => {
    expect(shipBoostReadinessVisual({ status: "flying", fuel: 48, boostCooldownSeconds: 0, launchBurstSecondsRemaining: 2.4 })).toEqual({
      color: 0xffd166,
      tone: "burst",
      radius: 31,
      width: 2.6,
      alpha: 0.48,
      progress: 1,
      segments: 8
    });
  });
});

describe("ship shield reserve visual", () => {
  it("stays hidden outside active flight or after the emergency shield is spent", () => {
    expect(shipShieldReserveVisual({ status: "paused", emergencyShieldAvailable: true, tick: 12 })).toBeUndefined();
    expect(shipShieldReserveVisual({ status: "flying", emergencyShieldAvailable: false, tick: 12 })).toBeUndefined();
  });

  it("shows a quiet pulsing reserve ring while the emergency shield is available", () => {
    const early = shipShieldReserveVisual({ status: "flying", emergencyShieldAvailable: true, tick: 4 });
    const later = shipShieldReserveVisual({ status: "flying", emergencyShieldAvailable: true, tick: 24 });

    expect(early).toMatchObject({
      color: 0xbff7ff,
      tone: "available"
    });
    expect(early?.radius).toBeGreaterThanOrEqual(32);
    expect(early?.radius).toBeLessThanOrEqual(38);
    expect(early?.alpha).toBeLessThanOrEqual(0.28);
    expect(early?.width).toBeLessThanOrEqual(1.8);
    expect(later?.radius).not.toBe(early?.radius);
  });
});

describe("cargo aura visual", () => {
  it("stays hidden without onboard cargo or outside active flight", () => {
    expect(cargoAuraVisual({ status: "flying", cargoOnboard: false, cargoDamage: 0 })).toBeUndefined();
    expect(cargoAuraVisual({ status: "paused", cargoOnboard: true, cargoDamage: 0 })).toBeUndefined();
  });

  it("shows a clean cargo integrity aura", () => {
    expect(cargoAuraVisual({ status: "flying", cargoOnboard: true, cargoDamage: 0 })).toMatchObject({
      color: 0x8ee6b8,
      tone: "secure",
      radius: 25,
      alpha: 0.22,
      width: 1.6
    });
  });

  it("escalates the aura as cargo damage rises", () => {
    const secure = cargoAuraVisual({ status: "flying", cargoOnboard: true, cargoDamage: 0 });
    const strained = cargoAuraVisual({ status: "flying", cargoOnboard: true, cargoDamage: 0.18 });
    const critical = cargoAuraVisual({ status: "flying", cargoOnboard: true, cargoDamage: 0.42 });

    expect(strained).toMatchObject({ color: 0xffd166, tone: "strained" });
    expect(critical).toMatchObject({ color: 0xff4d6d, tone: "critical" });
    expect(strained?.alpha).toBeGreaterThan(secure?.alpha ?? 0);
    expect(critical?.radius).toBeGreaterThan(strained?.radius ?? 0);
    expect(critical?.width).toBeGreaterThan(strained?.width ?? 0);
  });
});

describe("cargo fracture visual", () => {
  it("stays hidden until onboard cargo is actually damaged in flight", () => {
    expect(cargoFractureVisual({ status: "flying", cargoOnboard: false, cargoDamage: 0.22, tick: 10 })).toBeUndefined();
    expect(cargoFractureVisual({ status: "paused", cargoOnboard: true, cargoDamage: 0.22, tick: 10 })).toBeUndefined();
    expect(cargoFractureVisual({ status: "flying", cargoOnboard: true, cargoDamage: 0.01, tick: 10 })).toBeUndefined();
  });

  it("adds readable crack arcs as cargo damage escalates", () => {
    const strained = cargoFractureVisual({ status: "flying", cargoOnboard: true, cargoDamage: 0.14, tick: 8 });
    const critical = cargoFractureVisual({ status: "flying", cargoOnboard: true, cargoDamage: 0.46, tick: 8 });

    expect(strained).toMatchObject({ color: 0xffd166, tone: "strained", cracks: 3 });
    expect(critical).toMatchObject({ color: 0xff4d6d, tone: "critical", cracks: 5 });
    expect(critical?.radius).toBeGreaterThan(strained?.radius ?? 0);
    expect(critical?.length).toBeGreaterThan(strained?.length ?? 0);
    expect(critical?.alpha).toBeGreaterThan(strained?.alpha ?? 0);
  });

  it("animates crack placement over time without changing damage severity", () => {
    const early = cargoFractureVisual({ status: "flying", cargoOnboard: true, cargoDamage: 0.22, tick: 4 });
    const later = cargoFractureVisual({ status: "flying", cargoOnboard: true, cargoDamage: 0.22, tick: 24 });

    expect(later?.spin).not.toBe(early?.spin);
    expect(later).toMatchObject({
      color: early?.color,
      tone: early?.tone,
      cracks: early?.cracks,
      radius: early?.radius,
      length: early?.length
    });
  });
});

describe("velocity vector visual", () => {
  it("stays hidden outside active flight or while nearly stationary", () => {
    expect(velocityVectorVisual({ status: "paused", velocity: { x: 22, y: 0 } })).toBeUndefined();
    expect(velocityVectorVisual({ status: "flying", velocity: { x: 4, y: 0 } })).toBeUndefined();
  });

  it("scales up and changes tone as velocity becomes risky", () => {
    const cruise = velocityVectorVisual({ status: "flying", velocity: { x: 18, y: 0 }, allowedApproachSpeed: 40 });
    const overspeed = velocityVectorVisual({ status: "flying", velocity: { x: 52, y: 0 }, allowedApproachSpeed: 30 });

    expect(cruise).toMatchObject({ color: 0x7ce1ff, tone: "cruise" });
    expect(overspeed).toMatchObject({ color: 0xff4d6d, tone: "overspeed" });
    expect(overspeed?.length).toBeGreaterThan(cruise?.length ?? 0);
    expect(overspeed?.alpha).toBeGreaterThan(cruise?.alpha ?? 0);
    expect(overspeed?.width).toBeGreaterThan(cruise?.width ?? 0);
  });
});

describe("boost burst visual", () => {
  it("stays hidden unless a shockwave milestone is active", () => {
    expect(boostBurstVisual({ status: "paused", lastMilestone: "Boost Burn", tick: 12 })).toBeUndefined();
    expect(boostBurstVisual({ status: "flying", lastMilestone: "Cargo Loaded", tick: 12 })).toBeUndefined();
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

  it("returns a tighter green shockwave for assist burns", () => {
    const assist = boostBurstVisual({ status: "flying", lastMilestone: "Assist Burn", tick: 9 });

    expect(assist).toMatchObject({ color: 0x8ee6b8 });
    expect(assist?.radius).toBeGreaterThanOrEqual(16);
    expect(assist?.radius).toBeLessThanOrEqual(34);
    expect(assist?.width).toBeLessThan(4);
    expect(assist?.alpha).toBeGreaterThanOrEqual(0.2);
  });

  it("returns stronger shockwaves for fresh style hits", () => {
    const skim = boostBurstVisual({ status: "flying", lastMilestone: "Clean Hazard Skim", tick: 6 });
    const thread = boostBurstVisual({ status: "flying", lastMilestone: "Needle Thread", tick: 6 });
    const sling = boostBurstVisual({ status: "flying", lastMilestone: "Gravity Sling", tick: 6 });
    const maze = boostBurstVisual({ status: "flying", lastMilestone: "Maze Chain", tick: 6 });
    const finish = boostBurstVisual({ status: "delivered", lastMilestone: "Chain Finish", tick: 6 });

    expect(skim).toMatchObject({ color: 0xffd166 });
    expect(thread).toMatchObject({ color: 0xf8e59a });
    expect(sling).toMatchObject({ color: 0x7ce1ff });
    expect(maze).toMatchObject({ color: 0x9fe8c9 });
    expect(finish).toMatchObject({ color: 0x8ee6b8 });
    expect(thread?.radius).toBeGreaterThan(skim?.radius ?? 0);
    expect(sling?.radius).toBeGreaterThan(thread?.radius ?? 0);
    expect(maze?.radius).toBeGreaterThan(sling?.radius ?? 0);
    expect(finish?.radius).toBeGreaterThan(sling?.radius ?? 0);
    expect(thread?.alpha).toBeGreaterThanOrEqual(skim?.alpha ?? 0);
  });

  it("returns distinct shockwaves for rare finish and recovery style hits", () => {
    const eco = boostBurstVisual({ status: "delivered", lastMilestone: "Eco Drift", tick: 6 });
    const noBrake = boostBurstVisual({ status: "delivered", lastMilestone: "No Brake Finesse", tick: 6 });
    const perfect = boostBurstVisual({ status: "delivered", lastMilestone: "Perfect Approach", tick: 6 });
    const express = boostBurstVisual({ status: "delivered", lastMilestone: "Express Finish", tick: 6 });
    const damageControl = boostBurstVisual({ status: "delivered", lastMilestone: "Damage Control", tick: 6 });

    expect(eco).toMatchObject({ color: 0x8ee6b8 });
    expect(noBrake).toMatchObject({ color: 0xbff7ff });
    expect(perfect).toMatchObject({ color: 0xf8e59a });
    expect(express).toMatchObject({ color: 0xffd166 });
    expect(damageControl).toMatchObject({ color: 0xff9f1c });
    expect(noBrake?.radius).toBeGreaterThan(eco?.radius ?? 0);
    expect(perfect?.radius).toBeGreaterThan(eco?.radius ?? 0);
    expect(express?.radius).toBeGreaterThan(perfect?.radius ?? 0);
    expect(noBrake?.alpha).toBeGreaterThanOrEqual(eco?.alpha ?? 0);
    expect(damageControl?.alpha).toBeGreaterThanOrEqual(eco?.alpha ?? 0);
  });

  it("renders emergency shield rebounds as a wide recovery shock ring", () => {
    const shield = boostBurstVisual({ status: "flying", lastMilestone: "Shield Rebound", tick: 6 });

    expect(shield).toMatchObject({ color: 0xbff7ff });
    expect(shield?.radius).toBeGreaterThan(40);
    expect(shield?.width).toBeGreaterThan(3);
    expect(shield?.alpha).toBeGreaterThan(0.24);
  });

  it("turns early cargo chain rewards into readable pickup and launch pop rings", () => {
    const pickup = boostBurstVisual({ status: "flying", lastMilestone: "Quick Pickup", tick: 6 });
    const launch = boostBurstVisual({ status: "flying", lastMilestone: "Launch Burst", tick: 6 });

    expect(pickup).toMatchObject({ color: 0x8ee6b8 });
    expect(pickup?.radius).toBeGreaterThan(34);
    expect(pickup?.alpha).toBeGreaterThan(0.2);
    expect(launch).toMatchObject({ color: 0xffd166 });
    expect(launch?.radius).toBeGreaterThan(pickup?.radius ?? 0);
    expect(launch?.width).toBeGreaterThan(pickup?.width ?? 0);
  });
});

describe("boost spark visual", () => {
  it("stays hidden outside active boost and launch milestones", () => {
    expect(boostSparkVisual({ status: "paused", lastMilestone: "Boost Burn", tick: 12 })).toBeUndefined();
    expect(boostSparkVisual({ status: "flying", lastMilestone: "Cargo Loaded", tick: 12 })).toBeUndefined();
    expect(boostSparkVisual({ status: "flying", tick: 12 })).toBeUndefined();
  });

  it("renders boost burns as a short cyan afterburner fan", () => {
    const visual = boostSparkVisual({ status: "flying", lastMilestone: "Boost Burn", tick: 4 });

    expect(visual).toMatchObject({
      color: 0x7ce1ff,
      tone: "boost",
      sparks: 3
    });
    expect(visual?.length).toBeGreaterThan(24);
    expect(visual?.spread).toBeGreaterThan(0);
    expect(visual?.alpha).toBeGreaterThan(0.25);
  });

  it("renders launch bursts as a hotter wider fan than ordinary boost burns", () => {
    const boost = boostSparkVisual({ status: "flying", lastMilestone: "Boost Burn", tick: 4 });
    const launch = boostSparkVisual({ status: "flying", lastMilestone: "Launch Burst", tick: 4 });

    expect(launch).toMatchObject({
      color: 0xffd166,
      tone: "launch",
      sparks: 5
    });
    expect(launch?.length).toBeGreaterThan(boost?.length ?? 0);
    expect(launch?.spread).toBeGreaterThan(boost?.spread ?? 0);
    expect(launch?.alpha).toBeGreaterThan(boost?.alpha ?? 0);
  });
});
