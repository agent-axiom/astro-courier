import type { LandingGuidanceStatus, SimulationSnapshot, Vec2 } from "@astro-courier/shared";
import { Application, Container, Graphics } from "pixi.js";

export type AstroPixiRenderer = {
  mount(element: HTMLElement): Promise<void>;
  render(snapshot: SimulationSnapshot, trajectory: Vec2[]): void;
  destroy(): void;
};

type Star = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
};

export function createAstroPixiRenderer(): AstroPixiRenderer {
  return new PixiRenderer();
}

export function objectiveBeaconPulse(tick: number): { radius: number; alpha: number } {
  const wave = (Math.sin(tick * 0.12) + 1) / 2;
  return {
    radius: round(34 + wave * 16, 2),
    alpha: round(0.18 + (1 - wave) * 0.54, 2)
  };
}

export type ObjectiveGuidanceVisualInput = {
  distance: number;
  landingStatus: LandingGuidanceStatus;
  assistAvailable: boolean;
};

export type ObjectiveGuidanceVisual = {
  lineAlpha: number;
  lineWidth: number;
  markerScale: number;
  edgeAlpha: number;
};

export function objectiveGuidanceVisual(input: ObjectiveGuidanceVisualInput): ObjectiveGuidanceVisual {
  const proximity = 1 - clamp((input.distance - 60) / 840, 0, 1);
  const precisionBoost = input.assistAvailable || input.landingStatus === "ready" ? 1 : 0;

  return {
    lineAlpha: round(clamp(0.14 + proximity * 0.18 + precisionBoost * 0.08, 0.14, 0.44), 2),
    lineWidth: round(2 + precisionBoost, 2),
    markerScale: round(clamp(0.86 + proximity * 0.28 + precisionBoost * 0.14, 0.86, 1.28), 2),
    edgeAlpha: round(clamp(0.68 + proximity * 0.2 + precisionBoost * 0.08, 0.68, 0.96), 2)
  };
}

export type TrajectoryPointVisualInput = {
  status: SimulationSnapshot["status"];
  index: number;
  total: number;
  danger?: TrajectoryHazardDanger;
  sling?: TrajectoryGravitySlingSignal;
};

export type TrajectoryPointVisual = {
  color: number;
  radius: number;
  alpha: number;
};

export type TrajectoryHazardDanger = "near" | "inside";
export type TrajectoryGravitySlingSignal = "setup" | "ready";

export function trajectoryPointVisual(input: TrajectoryPointVisualInput): TrajectoryPointVisual | undefined {
  if (input.status !== "flying" || input.total <= 0) {
    return undefined;
  }

  const progress = clamp(input.index / Math.max(1, input.total - 1), 0, 1);
  const isEndpoint = input.index >= input.total - 1;
  if (input.danger) {
    return {
      color: input.danger === "inside" ? 0xff4d6d : 0xffd166,
      radius: input.danger === "inside" ? 5 : 4.1,
      alpha: input.danger === "inside" ? 0.88 : 0.72
    };
  }
  if (input.sling) {
    return {
      color: input.sling === "ready" ? 0xf8e59a : 0x7ce1ff,
      radius: input.sling === "ready" ? 4.6 : 4,
      alpha: input.sling === "ready" ? 0.78 : 0.64
    };
  }

  return {
    color: isEndpoint ? 0x7ce1ff : 0xf8e59a,
    radius: round(isEndpoint ? 4.2 : 2.2 + progress * 0.8, 2),
    alpha: round(isEndpoint ? 0.78 : 0.18 + progress * 0.42, 2)
  };
}

export function trajectoryHazardDanger(
  point: Vec2,
  hazards: SimulationSnapshot["hazards"]
): TrajectoryHazardDanger | undefined {
  let nearestDanger: TrajectoryHazardDanger | undefined;

  for (const hazard of hazards) {
    const distance = Math.hypot(point.x - hazard.position.x, point.y - hazard.position.y);
    if (distance <= hazard.radius) {
      return "inside";
    }
    if (distance <= hazard.radius * 1.6) {
      nearestDanger = "near";
    }
  }

  return nearestDanger;
}

const TRAJECTORY_SLING_OUTER_RADIUS = 3;
const TRAJECTORY_SLING_SAFE_SURFACE_RADIUS = 1.3;

export function trajectoryGravitySlingSignal(
  point: Vec2,
  gravitySources: SimulationSnapshot["gravitySources"],
  opportunity?: SimulationSnapshot["gravitySlingOpportunity"]
): TrajectoryGravitySlingSignal | undefined {
  for (const source of gravitySources) {
    const distance = Math.hypot(point.x - source.position.x, point.y - source.position.y);
    const outerRadius = Math.min(source.influenceRadius, source.radius * TRAJECTORY_SLING_OUTER_RADIUS);
    if (distance <= source.radius * TRAJECTORY_SLING_SAFE_SURFACE_RADIUS || distance > outerRadius) {
      continue;
    }
    return opportunity?.id === source.id && opportunity.ready ? "ready" : "setup";
  }

  return undefined;
}

type LandingPadVisualInput = Pick<SimulationSnapshot["landingPads"][number], "role" | "active" | "destination">;

export type LandingPadVisual = {
  color: number;
  strokeWidth: number;
  alpha: number;
  haloAlpha: number;
  beaconAlpha: number;
};

export function landingPadVisual(pad: LandingPadVisualInput): LandingPadVisual {
  const color = pad.role === "destination" ? 0xffd166 : pad.role === "pickup" ? 0x8ee6b8 : 0xa0c4ff;
  if (pad.active) {
    return {
      color,
      strokeWidth: 4,
      alpha: 1,
      haloAlpha: 0.18,
      beaconAlpha: 0.82
    };
  }
  if (pad.destination) {
    return {
      color,
      strokeWidth: 3,
      alpha: 0.68,
      haloAlpha: 0.08,
      beaconAlpha: 0
    };
  }
  return {
    color,
    strokeWidth: 2,
    alpha: 0.38,
    haloAlpha: 0,
    beaconAlpha: 0
  };
}

type HazardVignetteInput = Pick<SimulationSnapshot, "nearestHazard" | "status">;

export type HazardVignetteEffect = {
  color: number;
  width: number;
  alpha: number;
};

export function hazardVignetteEffect(snapshot: HazardVignetteInput): HazardVignetteEffect | undefined {
  const hazard = snapshot.nearestHazard;
  if (snapshot.status !== "flying" || !hazard) {
    return undefined;
  }

  if (hazard.dangerLevel === "inside") {
    return {
      color: 0xff4d6d,
      width: 10,
      alpha: round(clamp(0.24 + hazard.severity * 0.22, 0.22, 0.5), 2)
    };
  }

  const distancePastEdge = Math.max(0, hazard.distance - hazard.radius);
  const pressure = 1 - clamp(distancePastEdge / Math.max(1, hazard.radius), 0, 1);
  return {
    color: 0xffd166,
    width: 6,
    alpha: round(clamp(0.08 + pressure * 0.16 + hazard.severity * 0.06, 0.08, 0.32), 2)
  };
}

type HazardFieldVisualInput = Pick<SimulationSnapshot["hazards"][number], "severity">;

export type HazardFieldVisual = {
  fillAlpha: number;
  strokeAlpha: number;
  strokeWidth: number;
  rockCount: number;
};

export function hazardFieldVisual(hazard: HazardFieldVisualInput): HazardFieldVisual {
  return {
    fillAlpha: round(clamp(0.08 + hazard.severity * 0.14, 0.08, 0.24), 2),
    strokeAlpha: round(clamp(0.34 + hazard.severity * 0.28, 0.34, 0.62), 2),
    strokeWidth: round(1 + hazard.severity * 1.4, 2),
    rockCount: Math.round(7 + hazard.severity * 7)
  };
}

export type GravitySlingCueVisualInput = Pick<SimulationSnapshot, "status" | "gravitySlingOpportunity"> & {
  tick?: number;
};

export type GravitySlingCueVisual = {
  color: number;
  tone: "setup" | "ready";
  radiusOffset: number;
  dashRadius: number;
  alpha: number;
  width: number;
};

export function gravitySlingCueVisual(input: GravitySlingCueVisualInput): GravitySlingCueVisual | undefined {
  if (input.status !== "flying" || !input.gravitySlingOpportunity) {
    return undefined;
  }

  const pulse = (Math.sin((input.tick ?? 0) * 0.18) + 1) / 2;
  if (input.gravitySlingOpportunity.ready) {
    return {
      color: 0xf8e59a,
      tone: "ready",
      radiusOffset: round(30 + pulse * 9, 2),
      dashRadius: round(3.6 + pulse * 1.2, 2),
      alpha: round(0.34 + pulse * 0.18, 2),
      width: round(2.2 + pulse * 0.8, 2)
    };
  }

  return {
    color: 0x7ce1ff,
    tone: "setup",
    radiusOffset: round(24 + pulse * 7, 2),
    dashRadius: round(2.6 + pulse * 0.8, 2),
    alpha: round(0.2 + pulse * 0.12, 2),
    width: round(1.4 + pulse * 0.5, 2)
  };
}

export type ShipTrailVisualInput = {
  status: SimulationSnapshot["status"];
  speed: number;
  fuelRatio: number;
  cargoDamage?: number;
};

export type ShipTrailVisual = {
  color: number;
  tone: "sprint" | "comet" | "warning";
  length: number;
  radius: number;
  alpha: number;
};

export type VelocityVectorVisualInput = {
  status: SimulationSnapshot["status"];
  velocity: Vec2;
  allowedApproachSpeed?: number;
};

export type VelocityVectorVisual = {
  color: number;
  tone: "cruise" | "fast" | "overspeed";
  length: number;
  width: number;
  alpha: number;
};

export type BoostBurstVisualInput = {
  status: SimulationSnapshot["status"];
  lastMilestone?: string;
  tick: number;
};

export type BoostBurstVisual = {
  color: number;
  radius: number;
  alpha: number;
  width: number;
};

export function shipTrailVisual(input: ShipTrailVisualInput): ShipTrailVisual | undefined {
  if (input.status !== "flying" || input.speed <= 8) {
    return undefined;
  }

  const pressure = clamp((input.speed - 8) / 42, 0, 1);
  const lowFuel = input.fuelRatio <= 0.15;
  const cometReserve = input.speed >= 42 && input.fuelRatio >= 0.55 && (input.cargoDamage ?? 1) <= 0.02;
  const tone = lowFuel ? "warning" : cometReserve ? "comet" : "sprint";
  return {
    color: tone === "warning" ? 0xff4d6d : tone === "comet" ? 0x7ce1ff : 0xff9f1c,
    tone,
    length: round(18 + pressure * (tone === "comet" ? 34 : 28), 2),
    radius: round(4 + pressure * 8, 2),
    alpha: round(clamp(0.34 + pressure * (tone === "comet" ? 0.46 : 0.38), 0.34, tone === "comet" ? 0.8 : 0.72), 2)
  };
}

export function velocityVectorVisual(input: VelocityVectorVisualInput): VelocityVectorVisual | undefined {
  const speed = Math.hypot(input.velocity.x, input.velocity.y);
  if (input.status !== "flying" || speed < 6) {
    return undefined;
  }

  const safeSpeed = input.allowedApproachSpeed ?? 40;
  const tone: VelocityVectorVisual["tone"] =
    speed > safeSpeed * 1.2 ? "overspeed" : speed > safeSpeed * 0.78 ? "fast" : "cruise";
  const pressure = clamp((speed - 6) / 48, 0, 1);

  return {
    color: tone === "overspeed" ? 0xff4d6d : tone === "fast" ? 0xffd166 : 0x7ce1ff,
    tone,
    length: round(24 + pressure * 46, 2),
    width: tone === "overspeed" ? 3 : tone === "fast" ? 2.4 : 1.8,
    alpha: round(clamp(0.3 + pressure * 0.46 + (tone === "overspeed" ? 0.12 : 0), 0.3, 0.88), 2)
  };
}

export function boostBurstVisual(input: BoostBurstVisualInput): BoostBurstVisual | undefined {
  const pulse = (Math.sin(input.tick * 0.34) + 1) / 2;
  const styleShockwave = styleShockwaveSpec(input.lastMilestone);
  if (styleShockwave && (input.status === "flying" || input.status === "delivered")) {
    return {
      color: styleShockwave.color,
      radius: round(styleShockwave.baseRadius + pulse * styleShockwave.radiusPulse, 2),
      alpha: round(styleShockwave.baseAlpha + (1 - pulse) * styleShockwave.alphaPulse, 2),
      width: round(styleShockwave.baseWidth + pulse * styleShockwave.widthPulse, 2)
    };
  }

  if (input.status !== "flying") {
    return undefined;
  }

  if (input.lastMilestone === "Assist Burn") {
    return {
      color: 0x8ee6b8,
      radius: round(16 + pulse * 18, 2),
      alpha: round(0.2 + (1 - pulse) * 0.28, 2),
      width: round(1.4 + pulse * 2.1, 2)
    };
  }

  if (input.lastMilestone !== "Boost Burn") {
    return undefined;
  }

  return {
    color: 0x7ce1ff,
    radius: round(22 + pulse * 22, 2),
    alpha: round(0.16 + (1 - pulse) * 0.32, 2),
    width: round(2 + pulse * 2.8, 2)
  };
}

function styleShockwaveSpec(milestone?: string):
  | {
      color: number;
      baseRadius: number;
      radiusPulse: number;
      baseAlpha: number;
      alphaPulse: number;
      baseWidth: number;
      widthPulse: number;
    }
  | undefined {
  if (milestone === "Clean Hazard Skim") {
    return {
      color: 0xffd166,
      baseRadius: 18,
      radiusPulse: 24,
      baseAlpha: 0.14,
      alphaPulse: 0.26,
      baseWidth: 1.6,
      widthPulse: 2.2
    };
  }

  if (milestone === "Needle Thread") {
    return {
      color: 0xf8e59a,
      baseRadius: 24,
      radiusPulse: 32,
      baseAlpha: 0.18,
      alphaPulse: 0.3,
      baseWidth: 2,
      widthPulse: 2.8
    };
  }

  if (milestone === "Gravity Sling") {
    return {
      color: 0x7ce1ff,
      baseRadius: 28,
      radiusPulse: 36,
      baseAlpha: 0.18,
      alphaPulse: 0.32,
      baseWidth: 2.2,
      widthPulse: 3
    };
  }

  if (milestone === "Chain Finish") {
    return {
      color: 0x8ee6b8,
      baseRadius: 32,
      radiusPulse: 42,
      baseAlpha: 0.2,
      alphaPulse: 0.34,
      baseWidth: 2.4,
      widthPulse: 3.2
    };
  }

  return undefined;
}

class PixiRenderer implements AstroPixiRenderer {
  private app?: Application;
  private mountElement?: HTMLElement;
  private readonly stageRoot = new Container();
  private readonly background = new Graphics();
  private readonly gravity = new Graphics();
  private readonly trajectory = new Graphics();
  private readonly guidance = new Graphics();
  private readonly world = new Graphics();
  private readonly hazards = new Graphics();
  private readonly ship = new Graphics();
  private readonly screenFx = new Graphics();
  private readonly stars: Star[] = createStars(140);
  private destroyed = false;

  async mount(element: HTMLElement): Promise<void> {
    this.mountElement = element;
    const app = new Application();
    await app.init({
      resizeTo: element,
      antialias: true,
      backgroundAlpha: 0,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2)
    });

    if (this.destroyed) {
      app.destroy();
      return;
    }

    this.app = app;
    element.replaceChildren(app.canvas);
    app.stage.addChild(this.stageRoot);
    this.stageRoot.addChild(
      this.background,
      this.gravity,
      this.trajectory,
      this.guidance,
      this.world,
      this.hazards,
      this.ship,
      this.screenFx
    );
  }

  render(snapshot: SimulationSnapshot, trajectory: Vec2[]): void {
    if (!this.app) return;

    const viewport = {
      width: this.app.renderer.width,
      height: this.app.renderer.height
    };
    const camera = snapshot.ship.position;
    const project = (point: Vec2): Vec2 => ({
      x: point.x - camera.x + viewport.width / 2,
      y: point.y - camera.y + viewport.height / 2
    });

    this.drawBackground(viewport, snapshot.tick);
    this.drawGravity(snapshot, project);
    this.drawTrajectory(trajectory, project, snapshot);
    this.drawGuidance(snapshot, project, viewport);
    this.drawWorld(snapshot, project);
    this.drawHazards(snapshot, project);
    this.drawShip(snapshot, project);
    this.drawScreenFx(snapshot, viewport);
  }

  destroy(): void {
    this.destroyed = true;
    this.app?.destroy();
    this.mountElement?.replaceChildren();
    this.app = undefined;
  }

  private drawBackground(viewport: { width: number; height: number }, tick: number): void {
    this.background.clear();
    this.background.rect(0, 0, viewport.width, viewport.height).fill(0x080a18);

    for (const star of this.stars) {
      const drift = tick * 0.018 * star.radius;
      const x = positiveModulo(star.x * viewport.width - drift, viewport.width);
      const y = positiveModulo(star.y * viewport.height + drift * 0.18, viewport.height);
      this.background.circle(x, y, star.radius).fill({ color: 0xffffff, alpha: star.alpha });
    }
  }

  private drawGravity(snapshot: SimulationSnapshot, project: (point: Vec2) => Vec2): void {
    this.gravity.clear();
    const slingCue = gravitySlingCueVisual({
      status: snapshot.status,
      gravitySlingOpportunity: snapshot.gravitySlingOpportunity,
      tick: snapshot.tick
    });
    for (const source of snapshot.gravitySources) {
      const center = project(source.position);
      this.gravity
        .circle(center.x, center.y, source.influenceRadius)
        .stroke({ color: 0x6fb4ff, width: 1, alpha: 0.08 });
      this.gravity.circle(center.x, center.y, source.radius + 18).stroke({ color: 0x9ce8ff, width: 1, alpha: 0.2 });
      if (slingCue && snapshot.gravitySlingOpportunity?.id === source.id) {
        const radius = source.radius + slingCue.radiusOffset;
        this.gravity.circle(center.x, center.y, radius).stroke({
          color: slingCue.color,
          width: slingCue.width,
          alpha: slingCue.alpha
        });
        for (let index = 0; index < 4; index += 1) {
          const angle = snapshot.tick * 0.025 + index * (Math.PI / 2);
          const marker = {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius
          };
          this.gravity.circle(marker.x, marker.y, slingCue.dashRadius).fill({
            color: slingCue.color,
            alpha: Math.min(0.88, slingCue.alpha + 0.2)
          });
        }
      }
    }
  }

  private drawTrajectory(
    trajectory: Vec2[],
    project: (point: Vec2) => Vec2,
    snapshot: SimulationSnapshot
  ): void {
    this.trajectory.clear();

    for (let index = 0; index < trajectory.length; index += 1) {
      const worldPoint = trajectory[index];
      const point = project(worldPoint);
      const visual = trajectoryPointVisual({
        status: snapshot.status,
        index,
        total: trajectory.length,
        danger: trajectoryHazardDanger(worldPoint, snapshot.hazards),
        sling: trajectoryGravitySlingSignal(worldPoint, snapshot.gravitySources, snapshot.gravitySlingOpportunity)
      });
      if (!visual) continue;

      this.trajectory.circle(point.x, point.y, visual.radius).fill({ color: visual.color, alpha: visual.alpha });
      if (index === trajectory.length - 1) {
        this.trajectory.circle(point.x, point.y, visual.radius + 4).stroke({
          color: visual.color,
          width: 1,
          alpha: visual.alpha * 0.42
        });
      }
    }
  }

  private drawGuidance(
    snapshot: SimulationSnapshot,
    project: (point: Vec2) => Vec2,
    viewport: { width: number; height: number }
  ): void {
    this.guidance.clear();
    const target = snapshot.objectiveTarget;
    if (!target || (snapshot.status !== "flying" && snapshot.status !== "paused")) return;

    const ship = project(snapshot.ship.position);
    const targetPoint = project(target.position);
    const color = guidanceColor(target.landingStatus, target.assistAvailable);
    const pulse = objectiveBeaconPulse(snapshot.tick);
    const visual = objectiveGuidanceVisual({
      distance: target.distance,
      landingStatus: target.landingStatus,
      assistAvailable: target.assistAvailable
    });
    const targetOnScreen =
      targetPoint.x >= 0 && targetPoint.x <= viewport.width && targetPoint.y >= 0 && targetPoint.y <= viewport.height;

    this.guidance.moveTo(ship.x, ship.y).lineTo(targetPoint.x, targetPoint.y).stroke({
      color,
      width: visual.lineWidth,
      alpha: visual.lineAlpha
    });

    if (targetOnScreen) {
      this.guidance.circle(targetPoint.x, targetPoint.y, (pulse.radius + 12) * visual.markerScale).stroke({
        color,
        width: 1,
        alpha: pulse.alpha * 0.28
      });
      this.guidance
        .circle(targetPoint.x, targetPoint.y, pulse.radius * visual.markerScale)
        .stroke({ color, width: visual.lineWidth + 1, alpha: pulse.alpha });
      this.guidance.circle(targetPoint.x, targetPoint.y, 34 * visual.markerScale).stroke({
        color,
        width: visual.lineWidth,
        alpha: 0.65
      });
      this.guidance.circle(targetPoint.x, targetPoint.y, 5 * visual.markerScale).fill({ color, alpha: 0.9 });
      return;
    }

    const clamped = clampToViewport(targetPoint, viewport, 28);
    const angle = Math.atan2(targetPoint.y - ship.y, targetPoint.x - ship.x);
    const nose = {
      x: clamped.x + Math.cos(angle) * 14 * visual.markerScale,
      y: clamped.y + Math.sin(angle) * 14 * visual.markerScale
    };
    const left = {
      x: clamped.x + Math.cos(angle + 2.5) * 10 * visual.markerScale,
      y: clamped.y + Math.sin(angle + 2.5) * 10 * visual.markerScale
    };
    const right = {
      x: clamped.x + Math.cos(angle - 2.5) * 10 * visual.markerScale,
      y: clamped.y + Math.sin(angle - 2.5) * 10 * visual.markerScale
    };
    this.guidance.moveTo(nose.x, nose.y).lineTo(left.x, left.y).lineTo(right.x, right.y).closePath().fill({
      color,
      alpha: visual.edgeAlpha
    });
  }

  private drawWorld(snapshot: SimulationSnapshot, project: (point: Vec2) => Vec2): void {
    this.world.clear();

    for (const source of snapshot.gravitySources) {
      const center = project(source.position);
      this.world.circle(center.x, center.y, source.radius + 8).fill({ color: 0x254a86, alpha: 0.45 });
      this.world.circle(center.x, center.y, source.radius).fill(0x66c8ff);
      this.world.circle(center.x - source.radius * 0.25, center.y - source.radius * 0.3, source.radius * 0.28).fill({
        color: 0xd7fbff,
        alpha: 0.35
      });
    }

    for (const pad of snapshot.landingPads) {
      const center = project(pad.position);
      const visual = landingPadVisual(pad);
      if (visual.haloAlpha > 0) {
        this.world.circle(center.x, center.y, pad.radius + 12).fill({ color: visual.color, alpha: visual.haloAlpha * 0.58 });
        this.world.circle(center.x, center.y, pad.radius + 16).stroke({
          color: visual.color,
          width: 1,
          alpha: visual.haloAlpha
        });
      }
      this.world.circle(center.x, center.y, pad.radius).stroke({
        color: visual.color,
        width: visual.strokeWidth,
        alpha: visual.alpha
      });
      this.world
        .moveTo(center.x, center.y)
        .lineTo(center.x + Math.cos(pad.normalAngle) * pad.radius, center.y + Math.sin(pad.normalAngle) * pad.radius)
        .stroke({ color: visual.color, width: 2, alpha: visual.alpha });
      if (visual.beaconAlpha > 0) {
        this.world.circle(center.x, center.y, 4).fill({ color: visual.color, alpha: visual.beaconAlpha });
      }
    }
  }

  private drawHazards(snapshot: SimulationSnapshot, project: (point: Vec2) => Vec2): void {
    this.hazards.clear();
    for (const hazard of snapshot.hazards) {
      const center = project(hazard.position);
      const visual = hazardFieldVisual(hazard);
      this.hazards.circle(center.x, center.y, hazard.radius).fill({ color: 0xff5c7a, alpha: visual.fillAlpha });
      this.hazards.circle(center.x, center.y, hazard.radius).stroke({
        color: 0xff7a90,
        width: visual.strokeWidth,
        alpha: visual.strokeAlpha
      });
      for (let index = 0; index < visual.rockCount; index += 1) {
        const angle = (index / visual.rockCount) * Math.PI * 2;
        const rock = {
          x: center.x + Math.cos(angle) * hazard.radius * 0.62,
          y: center.y + Math.sin(angle) * hazard.radius * 0.36
        };
        this.hazards.circle(rock.x, rock.y, 3 + (index % 3)).fill({ color: 0xb56576, alpha: 0.8 });
      }
    }
  }

  private drawShip(snapshot: SimulationSnapshot, project: (point: Vec2) => Vec2): void {
    this.ship.clear();
    const center = project(snapshot.ship.position);
    const angle = snapshot.ship.rotation;
    const nose = {
      x: center.x + Math.cos(angle) * 16,
      y: center.y + Math.sin(angle) * 16
    };
    const left = {
      x: center.x + Math.cos(angle + 2.45) * 12,
      y: center.y + Math.sin(angle + 2.45) * 12
    };
    const right = {
      x: center.x + Math.cos(angle - 2.45) * 12,
      y: center.y + Math.sin(angle - 2.45) * 12
    };
    const speed = Math.hypot(snapshot.ship.velocity.x, snapshot.ship.velocity.y);
    const fuelRatio = snapshot.ship.maxFuel > 0 ? snapshot.ship.fuel / snapshot.ship.maxFuel : 0;
    const trail = shipTrailVisual({ status: snapshot.status, speed, fuelRatio, cargoDamage: snapshot.ship.cargoDamage });
    const boostBurst = boostBurstVisual({ status: snapshot.status, lastMilestone: snapshot.lastMilestone, tick: snapshot.tick });
    const velocityVector = velocityVectorVisual({
      status: snapshot.status,
      velocity: snapshot.ship.velocity,
      allowedApproachSpeed: snapshot.objectiveTarget?.allowedApproachSpeed
    });

    if (boostBurst) {
      this.ship.circle(center.x, center.y, boostBurst.radius).stroke({
        color: boostBurst.color,
        width: boostBurst.width,
        alpha: boostBurst.alpha
      });
      this.ship.circle(center.x, center.y, boostBurst.radius * 0.62).stroke({
        color: 0xffffff,
        width: 1,
        alpha: boostBurst.alpha * 0.42
      });
    }

    if (velocityVector) {
      const velocityAngle = Math.atan2(snapshot.ship.velocity.y, snapshot.ship.velocity.x);
      const start = {
        x: center.x + Math.cos(velocityAngle) * 20,
        y: center.y + Math.sin(velocityAngle) * 20
      };
      const tip = {
        x: center.x + Math.cos(velocityAngle) * (20 + velocityVector.length),
        y: center.y + Math.sin(velocityAngle) * (20 + velocityVector.length)
      };
      const leftWing = {
        x: tip.x - Math.cos(velocityAngle - 0.62) * 12,
        y: tip.y - Math.sin(velocityAngle - 0.62) * 12
      };
      const rightWing = {
        x: tip.x - Math.cos(velocityAngle + 0.62) * 12,
        y: tip.y - Math.sin(velocityAngle + 0.62) * 12
      };
      this.ship.moveTo(start.x, start.y).lineTo(tip.x, tip.y).stroke({
        color: velocityVector.color,
        width: velocityVector.width,
        alpha: velocityVector.alpha
      });
      this.ship.moveTo(leftWing.x, leftWing.y).lineTo(tip.x, tip.y).lineTo(rightWing.x, rightWing.y).stroke({
        color: velocityVector.color,
        width: velocityVector.width,
        alpha: velocityVector.alpha
      });
    }

    this.ship.moveTo(nose.x, nose.y).lineTo(left.x, left.y).lineTo(right.x, right.y).closePath().fill(0xfff7d6);
    this.ship.moveTo(nose.x, nose.y).lineTo(left.x, left.y).lineTo(right.x, right.y).closePath().stroke({
      color: 0x2e2d4d,
      width: 2,
      alpha: 1
    });

    if (trail) {
      const tail = {
        x: center.x - Math.cos(angle) * (16 + trail.length),
        y: center.y - Math.sin(angle) * (16 + trail.length)
      };
      const leftJet = {
        x: center.x + Math.cos(angle + Math.PI / 2) * trail.radius,
        y: center.y + Math.sin(angle + Math.PI / 2) * trail.radius
      };
      const rightJet = {
        x: center.x + Math.cos(angle - Math.PI / 2) * trail.radius,
        y: center.y + Math.sin(angle - Math.PI / 2) * trail.radius
      };
      this.ship.moveTo(leftJet.x, leftJet.y).lineTo(rightJet.x, rightJet.y).lineTo(tail.x, tail.y).closePath().fill({
        color: trail.color,
        alpha: trail.alpha * 0.42
      });
      this.ship.circle(center.x - Math.cos(angle) * 18, center.y - Math.sin(angle) * 18, trail.radius).fill({
        color: trail.color,
        alpha: trail.alpha
      });
    }
  }

  private drawScreenFx(snapshot: SimulationSnapshot, viewport: { width: number; height: number }): void {
    this.screenFx.clear();
    const fuelRatio = snapshot.ship.fuel / snapshot.ship.maxFuel;
    if (fuelRatio < 0.25 && snapshot.status === "flying") {
      this.screenFx.rect(0, 0, viewport.width, viewport.height).stroke({
        color: 0xff4d6d,
        width: 8,
        alpha: 0.18 + (0.25 - fuelRatio) * 0.7
      });
    }

    const hazardEffect = hazardVignetteEffect(snapshot);
    if (hazardEffect) {
      this.screenFx.rect(0, 0, viewport.width, viewport.height).stroke({
        color: hazardEffect.color,
        width: hazardEffect.width,
        alpha: hazardEffect.alpha
      });
    }
  }
}

function createStars(count: number): Star[] {
  let seed = 42;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  return Array.from({ length: count }, () => ({
    x: next(),
    y: next(),
    radius: 0.6 + next() * 1.8,
    alpha: 0.25 + next() * 0.65
  }));
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function guidanceColor(status: LandingGuidanceStatus, assistAvailable: boolean): number {
  if (assistAvailable) return 0x7ce1ff;
  if (status === "ready") return 0x8ee6b8;
  if (status === "too-fast") return 0xff6f91;
  if (status === "misaligned") return 0xffd166;
  return 0xa0c4ff;
}

function clampToViewport(point: Vec2, viewport: { width: number; height: number }, inset: number): Vec2 {
  return {
    x: Math.min(viewport.width - inset, Math.max(inset, point.x)),
    y: Math.min(viewport.height - inset, Math.max(inset, point.y))
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
