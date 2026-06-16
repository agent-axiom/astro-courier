import type { LandingGuidanceStatus, SimulationSnapshot, Vec2 } from "@astro-courier/shared";
import { Application, Container, Graphics } from "pixi.js";

export type AstroPixiRenderer = {
  mount(element: HTMLElement): Promise<void>;
  render(snapshot: SimulationSnapshot, trajectory: Vec2[], ghostTrail?: Vec2[]): void;
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

export type CameraFocusInput = Pick<SimulationSnapshot, "status" | "objectiveTarget"> & {
  ship: Pick<SimulationSnapshot["ship"], "position" | "velocity">;
};

export function cameraFocus(input: CameraFocusInput): Vec2 {
  const speed = Math.hypot(input.ship.velocity.x, input.ship.velocity.y);
  if (input.status !== "flying" || speed < 4) {
    return input.ship.position;
  }

  const dockingDamping =
    input.objectiveTarget && input.objectiveTarget.distance <= 120
      ? clamp(input.objectiveTarget.distance / 120, 0.25, 1)
      : 1;
  const lead = Math.min(72, speed * 1.15) * dockingDamping;
  return {
    x: round(input.ship.position.x + (input.ship.velocity.x / speed) * lead, 2),
    y: round(input.ship.position.y + (input.ship.velocity.y / speed) * lead, 2)
  };
}

export type ScreenShakeInput = Pick<SimulationSnapshot, "status" | "tick" | "lastMilestone" | "nearestHazard">;

export function screenShakeOffset(input: ScreenShakeInput): Vec2 {
  if (input.status !== "flying") {
    return { x: 0, y: 0 };
  }

  const hazardMagnitude =
    input.nearestHazard?.dangerLevel === "inside"
      ? clamp(4 + input.nearestHazard.severity * 7, 4, 10)
      : 0;
  const milestoneMagnitude = screenShakeMilestoneMagnitude(input.lastMilestone);
  const magnitude = Math.max(hazardMagnitude, milestoneMagnitude);
  if (magnitude <= 0) {
    return { x: 0, y: 0 };
  }

  const phase = input.tick * 1.731;
  return {
    x: round(Math.sin(phase) * magnitude, 2),
    y: round(Math.cos(phase * 1.37) * magnitude * 0.7, 2)
  };
}

function screenShakeMilestoneMagnitude(milestone?: string): number {
  if (milestone === "Boost Burn") {
    return 4;
  }
  if (milestone === "Shield Rebound") {
    return 5;
  }
  if (milestone === "Assist Burn") {
    return 3;
  }
  return styleShockwaveSpec(milestone) ? 2.5 : 0;
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

export type ObjectiveRouteBeamVisualInput = Pick<SimulationSnapshot, "status" | "objectivePhase" | "tick"> & {
  distance: number;
  landingStatus: LandingGuidanceStatus;
  assistAvailable: boolean;
};

export type ObjectiveRouteBeamVisual = {
  color: number;
  tone: "pickup" | "delivery" | "ready" | "warning";
  alpha: number;
  width: number;
  nodes: number;
  nodeRadius: number;
  flow: number;
};

export type ObjectiveDockGateVisualInput = Pick<SimulationSnapshot, "status" | "objectivePhase"> & {
  distance: number;
  landingStatus: LandingGuidanceStatus;
  assistAvailable: boolean;
};

export type ObjectiveDockGateVisual = {
  color: number;
  tone: "open" | "assist" | "brake" | "align";
  alpha: number;
  radius: number;
  width: number;
  segments: number;
};

export function objectiveGuidanceVisual(input: ObjectiveGuidanceVisualInput): ObjectiveGuidanceVisual {
  const proximity = 1 - clamp((input.distance - 60) / 840, 0, 1);
  const precisionBoost = input.assistAvailable || input.landingStatus === "ready" ? 1 : 0;
  const readyLockBoost = input.landingStatus === "ready" ? 0.1 : 0;

  return {
    lineAlpha: round(clamp(0.14 + proximity * 0.18 + precisionBoost * 0.08, 0.14, 0.44), 2),
    lineWidth: round(2 + precisionBoost, 2),
    markerScale: round(clamp(0.86 + proximity * 0.28 + precisionBoost * 0.14 + readyLockBoost, 0.86, 1.38), 2),
    edgeAlpha: round(clamp(0.68 + proximity * 0.2 + precisionBoost * 0.08, 0.68, 0.96), 2)
  };
}

export function objectiveRouteBeamVisual(input: ObjectiveRouteBeamVisualInput): ObjectiveRouteBeamVisual | undefined {
  if (input.status !== "flying" || input.objectivePhase === "complete") {
    return undefined;
  }

  const proximity = 1 - clamp((input.distance - 60) / 720, 0, 1);
  const ready = input.assistAvailable || input.landingStatus === "ready";
  const unsafe = input.landingStatus === "too-fast" || input.landingStatus === "misaligned";
  const tone: ObjectiveRouteBeamVisual["tone"] =
    input.objectivePhase === "pickup" ? "pickup" : unsafe ? "warning" : ready ? "ready" : "delivery";
  const color =
    tone === "pickup" || tone === "ready"
      ? 0x8ee6b8
      : tone === "warning" && input.landingStatus === "too-fast"
        ? 0xff6f91
        : 0xffd166;

  return {
    color,
    tone,
    alpha: round(clamp(0.14 + proximity * 0.2 + (ready ? 0.12 : 0) + (unsafe ? 0.1 : 0), 0.14, 0.58), 2),
    width: round(1.4 + proximity * 1 + (ready ? 0.8 : 0) + (unsafe ? 0.6 : 0), 2),
    nodes: input.distance < 140 ? 3 : input.distance < 360 ? 4 : 5,
    nodeRadius: round(2.1 + proximity * 1.1 + (ready ? 0.8 : 0) + (unsafe ? 0.5 : 0), 2),
    flow: round(positiveModulo(input.tick * 0.045, 1), 2)
  };
}

export function objectiveDockGateVisual(input: ObjectiveDockGateVisualInput): ObjectiveDockGateVisual | undefined {
  if (input.status !== "flying" || input.objectivePhase !== "delivery" || input.distance > 120 || input.landingStatus === "approach") {
    return undefined;
  }

  const proximity = 1 - clamp((input.distance - 24) / 96, 0, 1);
  if (input.assistAvailable) {
    return {
      color: 0x7ce1ff,
      tone: "assist",
      alpha: round(0.56 + proximity * 0.26, 2),
      radius: Math.round(38 + proximity * 10 + 2),
      width: round(2.5 + proximity, 1),
      segments: 3
    };
  }

  if (input.landingStatus === "ready") {
    return {
      color: 0x8ee6b8,
      tone: "open",
      alpha: round(0.5 + proximity * 0.32, 2),
      radius: Math.round(38 + proximity * 10),
      width: round(2.2 + proximity, 1),
      segments: 3
    };
  }

  if (input.landingStatus === "too-fast") {
    return {
      color: 0xff6f91,
      tone: "brake",
      alpha: round(0.52 + proximity * 0.28, 2),
      radius: Math.round(40 + proximity * 9),
      width: round(2 + proximity * 0.8, 1),
      segments: 6
    };
  }

  return {
    color: 0xffd166,
    tone: "align",
    alpha: round(0.48 + proximity * 0.26, 2),
    radius: Math.round(40 + proximity * 9),
    width: round(1.8 + proximity * 0.8, 1),
    segments: 4
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

export type TrajectorySegmentVisualInput = {
  status: SimulationSnapshot["status"];
  index: number;
  total: number;
  danger?: TrajectoryHazardDanger;
  sling?: TrajectoryGravitySlingSignal;
};

export type TrajectorySegmentVisual = {
  color: number;
  width: number;
  alpha: number;
  tone: "inside" | "near" | "safe" | "sling-ready" | "sling-setup";
};

export type GhostTrailPointVisualInput = {
  status: SimulationSnapshot["status"];
  index: number;
  total: number;
};

export type GhostTrailPointVisual = {
  color: number;
  radius: number;
  alpha: number;
};

export type GhostTrailSegmentVisualInput = {
  status: SimulationSnapshot["status"];
  index: number;
  total: number;
  tick: number;
};

export type GhostTrailSegmentVisual = {
  color: number;
  width: number;
  alpha: number;
};

export type TrajectoryHazardDanger = "near" | "inside";
export type TrajectoryGravitySlingSignal = "setup" | "ready";

export type TrajectoryHazardMarkerVisualInput = {
  status: SimulationSnapshot["status"];
  trajectory: Vec2[];
  hazards: SimulationSnapshot["hazards"];
};

export type TrajectoryHazardMarkerVisual = {
  index: number;
  tone: TrajectoryHazardDanger;
  color: number;
  radius: number;
  alpha: number;
  width: number;
};

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

export function trajectorySegmentVisual(input: TrajectorySegmentVisualInput): TrajectorySegmentVisual | undefined {
  if (input.status !== "flying" || input.total < 2 || input.index <= 0) {
    return undefined;
  }

  const progress = clamp(input.index / Math.max(1, input.total - 1), 0, 1);
  if (input.danger) {
    return {
      color: input.danger === "inside" ? 0xff4d6d : 0xffd166,
      width: input.danger === "inside" ? 2.8 : 2.2,
      alpha: input.danger === "inside" ? 0.7 : 0.54,
      tone: input.danger
    };
  }

  if (input.sling) {
    return {
      color: input.sling === "ready" ? 0xf8e59a : 0x7ce1ff,
      width: input.sling === "ready" ? 2.5 : 2.1,
      alpha: input.sling === "ready" ? 0.62 : 0.48,
      tone: input.sling === "ready" ? "sling-ready" : "sling-setup"
    };
  }

  return {
    color: progress >= 0.82 ? 0x7ce1ff : 0xf8e59a,
    width: round(1 + progress * 0.35, 2),
    alpha: round(0.12 + progress * 0.2, 2),
    tone: "safe"
  };
}

export function ghostTrailPointVisual(input: GhostTrailPointVisualInput): GhostTrailPointVisual | undefined {
  if ((input.status !== "flying" && input.status !== "paused") || input.total < 2) {
    return undefined;
  }

  const progress = clamp(input.index / Math.max(1, input.total - 1), 0, 1);
  const isEndpoint = input.index >= input.total - 1;
  return {
    color: isEndpoint ? 0xf8e59a : 0x8ee6b8,
    radius: round(isEndpoint ? 3.8 : 2.4 + progress * 0.5, 2),
    alpha: round(isEndpoint ? 0.72 : 0.24 + progress * 0.28, 2)
  };
}

export function ghostTrailSegmentVisual(input: GhostTrailSegmentVisualInput): GhostTrailSegmentVisual | undefined {
  if ((input.status !== "flying" && input.status !== "paused") || input.total < 2) {
    return undefined;
  }

  const progress = clamp(input.index / Math.max(1, input.total - 1), 0, 1);
  const pulse = input.status === "flying" ? (Math.sin(input.tick * 0.12 + input.index * 0.9) + 1) / 2 : 0;
  const activeBoost = input.status === "flying" ? 1 : 0;
  return {
    color: progress >= 0.92 ? 0xf8e59a : 0x8ee6b8,
    width: round(1.3 + activeBoost * (0.45 + progress * 0.3), 2),
    alpha: round(0.16 + progress * 0.18 + activeBoost * 0.12 + pulse * 0.08, 2)
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

export function trajectoryHazardMarkerVisual(
  input: TrajectoryHazardMarkerVisualInput
): TrajectoryHazardMarkerVisual | undefined {
  if (input.status !== "flying" || input.trajectory.length === 0 || input.hazards.length === 0) {
    return undefined;
  }

  for (let index = 0; index < input.trajectory.length; index += 1) {
    const point = input.trajectory[index];
    let nearSeverity = 0;
    for (const hazard of input.hazards) {
      const distance = Math.hypot(point.x - hazard.position.x, point.y - hazard.position.y);
      if (distance <= hazard.radius) {
        return trajectoryHazardMarker(index, "inside", hazard.severity);
      }
      if (distance <= hazard.radius * 1.6) {
        nearSeverity = Math.max(nearSeverity, hazard.severity);
      }
    }
    if (nearSeverity > 0) {
      return trajectoryHazardMarker(index, "near", nearSeverity);
    }
  }

  return undefined;
}

function trajectoryHazardMarker(
  index: number,
  tone: TrajectoryHazardDanger,
  severity: number
): TrajectoryHazardMarkerVisual {
  const pressure = clamp(severity, 0, 1);
  const inside = tone === "inside";
  return {
    index,
    tone,
    color: inside ? 0xff4d6d : 0xffd166,
    radius: round(8 + pressure * 3 + (inside ? 3 : 0), 2),
    alpha: round(clamp((inside ? 0.62 : 0.46) + pressure * (inside ? 0.16 : 0.1), 0.38, 0.82), 2),
    width: round(1.4 + pressure * 1.2 + (inside ? 0.6 : 0), 2)
  };
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
  haloRadiusMultiplier: number;
  beaconAlpha: number;
};

export type LandingCorridorVisualInput = {
  status: SimulationSnapshot["status"];
  active: boolean;
  distance: number;
  landingStatus: LandingGuidanceStatus;
  assistAvailable: boolean;
};

export type LandingCorridorVisual = {
  color: number;
  tone: "approach" | "ready" | "assist" | "too-fast" | "misaligned";
  length: number;
  alpha: number;
  width: number;
};

export type ApproachLockVisualInput = Pick<SimulationSnapshot, "objectivePhase" | "status"> & {
  objectiveTarget?: Pick<NonNullable<SimulationSnapshot["objectiveTarget"]>, "distance" | "landingStatus" | "role">;
  cargoDamage: number;
  approachStreakSeconds: number;
};

export type ApproachLockVisual = {
  color: number;
  tone: "armed" | "charging";
  progress: number;
  radius: number;
  alpha: number;
  width: number;
};

const APPROACH_LOCK_ARM_SECONDS = 1;
const APPROACH_LOCK_MIN_SECONDS = 0.25;

export function landingPadVisual(pad: LandingPadVisualInput): LandingPadVisual {
  const color = pad.role === "destination" ? 0xffd166 : pad.role === "pickup" ? 0x8ee6b8 : 0xa0c4ff;
  if (pad.active) {
    return {
      color,
      strokeWidth: 4,
      alpha: 1,
      haloAlpha: 0.18,
      haloRadiusMultiplier: 3.5,
      beaconAlpha: 0.82
    };
  }
  if (pad.destination) {
    return {
      color,
      strokeWidth: 3,
      alpha: 0.68,
      haloAlpha: 0.08,
      haloRadiusMultiplier: 1.7,
      beaconAlpha: 0
    };
  }
  return {
    color,
    strokeWidth: 2,
    alpha: 0.38,
    haloAlpha: 0,
    haloRadiusMultiplier: 1,
    beaconAlpha: 0
  };
}

export function landingCorridorVisual(input: LandingCorridorVisualInput): LandingCorridorVisual | undefined {
  if (!input.active || (input.status !== "flying" && input.status !== "paused")) {
    return undefined;
  }

  const proximity = 1 - clamp((input.distance - 24) / 220, 0, 1);
  const tone: LandingCorridorVisual["tone"] = input.assistAvailable
    ? "assist"
    : input.landingStatus === "ready"
      ? "ready"
      : input.landingStatus;
  const color =
    tone === "assist"
      ? 0x7ce1ff
      : tone === "ready"
        ? 0x8ee6b8
        : tone === "too-fast"
          ? 0xff6f91
          : tone === "misaligned"
            ? 0xffd166
            : 0xa0c4ff;
  const precisionBoost = tone === "ready" || tone === "assist" ? 1 : 0;
  const unsafeBoost = tone === "too-fast" || tone === "misaligned" ? 1 : 0;

  return {
    color,
    tone,
    length: round(34 + proximity * 32 + precisionBoost * 8, 2),
    alpha: round(clamp(0.2 + proximity * 0.34 + precisionBoost * 0.12 + unsafeBoost * 0.1, 0.2, 0.78), 2),
    width: round(1.2 + proximity * 1.1 + precisionBoost * 0.6 + unsafeBoost * 0.35, 2)
  };
}

export function approachLockVisual(input: ApproachLockVisualInput): ApproachLockVisual | undefined {
  const target = input.objectiveTarget;
  if (
    input.status !== "flying" ||
    input.objectivePhase !== "delivery" ||
    !target ||
    target.role !== "destination" ||
    target.landingStatus !== "ready" ||
    input.cargoDamage > 0.02 ||
    input.approachStreakSeconds < APPROACH_LOCK_MIN_SECONDS
  ) {
    return undefined;
  }

  const progress = clamp(input.approachStreakSeconds / APPROACH_LOCK_ARM_SECONDS, 0, 1);
  const armed = progress >= 1;
  const proximity = 1 - clamp((target.distance - 24) / 96, 0, 1);
  return {
    color: armed ? 0xf8e59a : 0x8ee6b8,
    tone: armed ? "armed" : "charging",
    progress: round(progress, 2),
    radius: round(48 + proximity * 10 + progress * 8, 2),
    alpha: round(0.24 + proximity * 0.08 + progress * 0.24 + (armed ? 0.08 : 0), 2),
    width: round(1.4 + progress * 1.6 + (armed ? 0.5 : 0), 2)
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

export type GravitySurfaceRimVisualInput = Pick<SimulationSnapshot, "status">;

export type GravitySurfaceRimVisual = {
  color: number;
  alpha: number;
  width: number;
};

export function gravitySurfaceRimVisual(input: GravitySurfaceRimVisualInput): GravitySurfaceRimVisual {
  if (input.status === "flying") {
    return {
      color: 0xd7fbff,
      alpha: 0.34,
      width: 1.5
    };
  }

  return {
    color: 0xd7fbff,
    alpha: 0.18,
    width: 1
  };
}

export type ShipTrailVisualInput = {
  status: SimulationSnapshot["status"];
  speed: number;
  fuelRatio: number;
  cargoDamage?: number;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
};

export type ShipTrailVisual = {
  color: number;
  tone: "sprint" | "comet" | "chain" | "warning";
  length: number;
  radius: number;
  alpha: number;
};

export type ShipBoostReadinessVisualInput = {
  status: SimulationSnapshot["status"];
  fuel: number;
  boostCooldownSeconds: number;
  launchBurstSecondsRemaining?: number;
};

export type ShipBoostReadinessVisual = {
  color: number;
  tone: "ready" | "cooldown" | "burst";
  radius: number;
  width: number;
  alpha: number;
  progress: number;
  segments: number;
};

export type ShipShieldReserveVisualInput = Pick<SimulationSnapshot, "status" | "emergencyShieldAvailable" | "tick">;

export type ShipShieldReserveVisual = {
  color: number;
  tone: "available";
  radius: number;
  width: number;
  alpha: number;
};

export type CargoAuraVisualInput = Pick<SimulationSnapshot, "status" | "cargoOnboard"> & {
  cargoDamage: number;
};

export type CargoAuraVisual = {
  color: number;
  tone: "secure" | "strained" | "critical";
  radius: number;
  alpha: number;
  width: number;
};

export type CargoFractureVisualInput = Pick<SimulationSnapshot, "status" | "cargoOnboard" | "tick"> & {
  cargoDamage: number;
};

export type CargoFractureVisual = {
  color: number;
  tone: "strained" | "critical";
  cracks: number;
  radius: number;
  length: number;
  alpha: number;
  width: number;
  spin: number;
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

export type BoostSparkVisualInput = {
  status: SimulationSnapshot["status"];
  lastMilestone?: string;
  tick: number;
};

export type BoostSparkVisual = {
  color: number;
  tone: "boost" | "launch";
  sparks: number;
  length: number;
  spread: number;
  alpha: number;
  width: number;
};

export function shipTrailVisual(input: ShipTrailVisualInput): ShipTrailVisual | undefined {
  if (input.status !== "flying" || input.speed <= 8) {
    return undefined;
  }

  const pressure = clamp((input.speed - 8) / 42, 0, 1);
  const lowFuel = input.fuelRatio <= 0.15;
  const chainActive = (input.styleMultiplier ?? 1) > 1 && (input.styleChainSecondsRemaining ?? 0) > 0;
  const cometReserve = input.speed >= 42 && input.fuelRatio >= 0.55 && (input.cargoDamage ?? 1) <= 0.02;
  const tone = lowFuel ? "warning" : chainActive ? "chain" : cometReserve ? "comet" : "sprint";
  const trailBoost = tone === "comet" ? 34 : tone === "chain" ? 32 : 28;
  const alphaBoost = tone === "comet" ? 0.46 : tone === "chain" ? 0.44 : 0.38;
  const alphaMax = tone === "comet" ? 0.8 : tone === "chain" ? 0.78 : 0.72;
  return {
    color: tone === "warning" ? 0xff4d6d : tone === "chain" ? 0x8ee6b8 : tone === "comet" ? 0x7ce1ff : 0xff9f1c,
    tone,
    length: round(18 + pressure * trailBoost, 2),
    radius: round(4 + pressure * 8, 2),
    alpha: round(clamp(0.34 + pressure * alphaBoost, 0.34, alphaMax), 2)
  };
}

const BOOST_READINESS_COOLDOWN_SECONDS = 1.15;
const BOOST_READINESS_SEGMENTS = 8;
const BOOST_MINIMUM_FUEL = 2;

export function shipBoostReadinessVisual(input: ShipBoostReadinessVisualInput): ShipBoostReadinessVisual | undefined {
  if (input.status !== "flying" || input.fuel <= BOOST_MINIMUM_FUEL) {
    return undefined;
  }

  const cooldownProgress = round(clamp(1 - input.boostCooldownSeconds / BOOST_READINESS_COOLDOWN_SECONDS, 0, 1), 2);
  if (cooldownProgress < 1) {
    return {
      color: 0xa0c4ff,
      tone: "cooldown",
      radius: 26,
      width: 1.4,
      alpha: 0.24,
      progress: cooldownProgress,
      segments: Math.max(1, Math.round(cooldownProgress * BOOST_READINESS_SEGMENTS))
    };
  }

  if ((input.launchBurstSecondsRemaining ?? 0) > 0) {
    return {
      color: 0xffd166,
      tone: "burst",
      radius: 31,
      width: 2.6,
      alpha: 0.48,
      progress: 1,
      segments: BOOST_READINESS_SEGMENTS
    };
  }

  return {
    color: 0x7ce1ff,
    tone: "ready",
    radius: 28,
    width: 1.8,
    alpha: 0.34,
    progress: 1,
    segments: BOOST_READINESS_SEGMENTS
  };
}

export function shipShieldReserveVisual(input: ShipShieldReserveVisualInput): ShipShieldReserveVisual | undefined {
  if (input.status !== "flying" || !input.emergencyShieldAvailable) {
    return undefined;
  }

  const pulse = (Math.sin(input.tick * 0.16) + 1) / 2;
  return {
    color: 0xbff7ff,
    tone: "available",
    radius: round(32 + pulse * 6, 2),
    width: round(1.1 + pulse * 0.7, 2),
    alpha: round(0.14 + pulse * 0.14, 2)
  };
}

export function cargoAuraVisual(input: CargoAuraVisualInput): CargoAuraVisual | undefined {
  if (input.status !== "flying" || !input.cargoOnboard) {
    return undefined;
  }

  const damage = clamp(input.cargoDamage, 0, 1);
  const pressure = clamp(damage / 0.5, 0, 1);
  const tone: CargoAuraVisual["tone"] = damage >= 0.3 ? "critical" : damage > 0.02 ? "strained" : "secure";

  return {
    color: tone === "critical" ? 0xff4d6d : tone === "strained" ? 0xffd166 : 0x8ee6b8,
    tone,
    radius: round(25 + pressure * 10, 2),
    alpha: round(0.22 + pressure * 0.22, 2),
    width: round(1.6 + pressure * 1.6, 2)
  };
}

export function cargoFractureVisual(input: CargoFractureVisualInput): CargoFractureVisual | undefined {
  if (input.status !== "flying" || !input.cargoOnboard || input.cargoDamage <= 0.02) {
    return undefined;
  }

  const damage = clamp(input.cargoDamage, 0, 1);
  const pressure = clamp((damage - 0.02) / 0.48, 0, 1);
  const tone: CargoFractureVisual["tone"] = damage >= 0.3 ? "critical" : "strained";

  return {
    color: tone === "critical" ? 0xff4d6d : 0xffd166,
    tone,
    cracks: tone === "critical" ? 5 : 3,
    radius: round(29 + pressure * 10, 2),
    length: round(7 + pressure * 9, 2),
    alpha: round(0.32 + pressure * 0.38, 2),
    width: round(1.2 + pressure * 1.1, 2),
    spin: round((input.tick * 0.08) % (Math.PI * 2), 2)
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

export function boostSparkVisual(input: BoostSparkVisualInput): BoostSparkVisual | undefined {
  if (input.status !== "flying") {
    return undefined;
  }

  const pulse = (Math.sin(input.tick * 0.42) + 1) / 2;
  if (input.lastMilestone === "Launch Burst") {
    return {
      color: 0xffd166,
      tone: "launch",
      sparks: 5,
      length: round(36 + pulse * 24, 2),
      spread: round(0.55 + pulse * 0.24, 2),
      alpha: round(0.42 + (1 - pulse) * 0.28, 2),
      width: round(2.4 + pulse * 1.2, 2)
    };
  }

  if (input.lastMilestone !== "Boost Burn") {
    return undefined;
  }

  return {
    color: 0x7ce1ff,
    tone: "boost",
    sparks: 3,
    length: round(28 + pulse * 18, 2),
    spread: round(0.34 + pulse * 0.18, 2),
    alpha: round(0.3 + (1 - pulse) * 0.22, 2),
    width: round(1.8 + pulse * 0.9, 2)
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

  if (milestone === "Eco Drift") {
    return {
      color: 0x8ee6b8,
      baseRadius: 26,
      radiusPulse: 30,
      baseAlpha: 0.16,
      alphaPulse: 0.3,
      baseWidth: 1.8,
      widthPulse: 2.6
    };
  }

  if (milestone === "No Brake Finesse") {
    return {
      color: 0xbff7ff,
      baseRadius: 27,
      radiusPulse: 32,
      baseAlpha: 0.17,
      alphaPulse: 0.31,
      baseWidth: 1.9,
      widthPulse: 2.7
    };
  }

  if (milestone === "Perfect Approach") {
    return {
      color: 0xf8e59a,
      baseRadius: 28,
      radiusPulse: 34,
      baseAlpha: 0.18,
      alphaPulse: 0.32,
      baseWidth: 2,
      widthPulse: 2.8
    };
  }

  if (milestone === "Express Finish") {
    return {
      color: 0xffd166,
      baseRadius: 31,
      radiusPulse: 40,
      baseAlpha: 0.2,
      alphaPulse: 0.34,
      baseWidth: 2.4,
      widthPulse: 3.2
    };
  }

  if (milestone === "Damage Control") {
    return {
      color: 0xff9f1c,
      baseRadius: 29,
      radiusPulse: 34,
      baseAlpha: 0.18,
      alphaPulse: 0.32,
      baseWidth: 2.1,
      widthPulse: 2.8
    };
  }

  if (milestone === "Shield Rebound") {
    return {
      color: 0xbff7ff,
      baseRadius: 34,
      radiusPulse: 28,
      baseAlpha: 0.26,
      alphaPulse: 0.34,
      baseWidth: 3.1,
      widthPulse: 2.4
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
  private readonly ghost = new Graphics();
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
      this.ghost,
      this.trajectory,
      this.guidance,
      this.world,
      this.hazards,
      this.ship,
      this.screenFx
    );
  }

  render(snapshot: SimulationSnapshot, trajectory: Vec2[], ghostTrail: Vec2[] = []): void {
    if (!this.app) return;

    const viewport = {
      width: this.app.renderer.width,
      height: this.app.renderer.height
    };
    const camera = cameraFocus(snapshot);
    const shake = screenShakeOffset(snapshot);
    const project = (point: Vec2): Vec2 => ({
      x: point.x - camera.x + viewport.width / 2 + shake.x,
      y: point.y - camera.y + viewport.height / 2 + shake.y
    });

    this.drawBackground(viewport, snapshot.tick);
    this.drawGravity(snapshot, project);
    this.drawGhostTrail(ghostTrail, project, snapshot);
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

  private drawGhostTrail(ghostTrail: Vec2[], project: (point: Vec2) => Vec2, snapshot: SimulationSnapshot): void {
    this.ghost.clear();

    for (let index = 0; index < ghostTrail.length; index += 1) {
      const visual = ghostTrailPointVisual({ status: snapshot.status, index, total: ghostTrail.length });
      if (!visual) {
        continue;
      }

      const point = project(ghostTrail[index]);
      if (index > 0) {
        const segment = ghostTrailSegmentVisual({ status: snapshot.status, index, total: ghostTrail.length, tick: snapshot.tick });
        const previous = project(ghostTrail[index - 1]);
        if (segment) {
          this.ghost.moveTo(previous.x, previous.y).lineTo(point.x, point.y).stroke(segment);
        }
      }
      this.ghost.circle(point.x, point.y, visual.radius).fill({ color: visual.color, alpha: visual.alpha });
    }
  }

  private drawTrajectory(
    trajectory: Vec2[],
    project: (point: Vec2) => Vec2,
    snapshot: SimulationSnapshot
  ): void {
    this.trajectory.clear();
    const hazardMarker = trajectoryHazardMarkerVisual({
      status: snapshot.status,
      trajectory,
      hazards: snapshot.hazards
    });

    for (let index = 0; index < trajectory.length; index += 1) {
      const worldPoint = trajectory[index];
      const point = project(worldPoint);
      const danger = trajectoryHazardDanger(worldPoint, snapshot.hazards);
      const sling = trajectoryGravitySlingSignal(worldPoint, snapshot.gravitySources, snapshot.gravitySlingOpportunity);
      if (index > 0) {
        const segment = trajectorySegmentVisual({
          status: snapshot.status,
          index,
          total: trajectory.length,
          danger,
          sling
        });
        if (segment) {
          const previous = project(trajectory[index - 1]);
          this.trajectory.moveTo(previous.x, previous.y).lineTo(point.x, point.y).stroke({
            color: segment.color,
            width: segment.width,
            alpha: segment.alpha
          });
        }
      }
      const visual = trajectoryPointVisual({
        status: snapshot.status,
        index,
        total: trajectory.length,
        danger,
        sling
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

    if (hazardMarker) {
      const point = project(trajectory[hazardMarker.index]);
      this.trajectory.circle(point.x, point.y, hazardMarker.radius).stroke({
        color: hazardMarker.color,
        width: hazardMarker.width,
        alpha: hazardMarker.alpha
      });
      this.trajectory.circle(point.x, point.y, hazardMarker.radius + 5).stroke({
        color: hazardMarker.color,
        width: 1,
        alpha: hazardMarker.alpha * 0.32
      });
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
    const routeBeam = objectiveRouteBeamVisual({
      status: snapshot.status,
      objectivePhase: snapshot.objectivePhase,
      distance: target.distance,
      landingStatus: target.landingStatus,
      assistAvailable: target.assistAvailable,
      tick: snapshot.tick
    });
    const approachLock = approachLockVisual({
      status: snapshot.status,
      objectivePhase: snapshot.objectivePhase,
      objectiveTarget: target,
      cargoDamage: snapshot.ship.cargoDamage,
      approachStreakSeconds: snapshot.approachStreakSeconds
    });
    const dockGate = objectiveDockGateVisual({
      status: snapshot.status,
      objectivePhase: snapshot.objectivePhase,
      distance: target.distance,
      landingStatus: target.landingStatus,
      assistAvailable: target.assistAvailable
    });
    const targetOnScreen =
      targetPoint.x >= 0 && targetPoint.x <= viewport.width && targetPoint.y >= 0 && targetPoint.y <= viewport.height;

    if (routeBeam) {
      drawObjectiveRouteBeam(this.guidance, ship, targetPoint, routeBeam);
    }

    this.guidance.moveTo(ship.x, ship.y).lineTo(targetPoint.x, targetPoint.y).stroke({
      color,
      width: visual.lineWidth,
      alpha: visual.lineAlpha
    });

    if (targetOnScreen) {
      if (approachLock) {
        this.guidance.circle(targetPoint.x, targetPoint.y, approachLock.radius).stroke({
          color: approachLock.color,
          width: approachLock.width,
          alpha: approachLock.alpha
        });
        if (approachLock.tone === "armed") {
          this.guidance.circle(targetPoint.x, targetPoint.y, approachLock.radius - 9).stroke({
            color: 0xffffff,
            width: 1,
            alpha: approachLock.alpha * 0.34
          });
        }
      }
      if (dockGate) {
        drawObjectiveDockGate(this.guidance, targetPoint.x, targetPoint.y, dockGate);
      }
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
    const objectiveTarget = snapshot.objectiveTarget;
    const gravitySurfaceRim = gravitySurfaceRimVisual({ status: snapshot.status });

    for (const source of snapshot.gravitySources) {
      const center = project(source.position);
      this.world.circle(center.x, center.y, source.radius + 8).fill({ color: 0x254a86, alpha: 0.45 });
      this.world.circle(center.x, center.y, source.radius).fill(0x66c8ff);
      this.world.circle(center.x - source.radius * 0.25, center.y - source.radius * 0.3, source.radius * 0.28).fill({
        color: 0xd7fbff,
        alpha: 0.35
      });
      this.world.circle(center.x, center.y, source.radius).stroke({
        color: gravitySurfaceRim.color,
        width: gravitySurfaceRim.width,
        alpha: gravitySurfaceRim.alpha
      });
    }

    for (const pad of snapshot.landingPads) {
      const center = project(pad.position);
      const visual = landingPadVisual(pad);
      const corridor =
        objectiveTarget?.id === pad.id
          ? landingCorridorVisual({
              status: snapshot.status,
              active: pad.active,
              distance: objectiveTarget.distance,
              landingStatus: objectiveTarget.landingStatus,
              assistAvailable: objectiveTarget.assistAvailable
            })
          : undefined;
      const corridorTarget = objectiveTarget?.id === pad.id ? objectiveTarget : undefined;
      if (corridor && corridorTarget) {
        const corridorInner = pad.radius + 8;
        const corridorOuter = pad.radius + corridor.length;
        const leftAngle = pad.normalAngle + corridorTarget.requiredAngleTolerance;
        const rightAngle = pad.normalAngle - corridorTarget.requiredAngleTolerance;
        const centerStart = {
          x: center.x + Math.cos(pad.normalAngle) * corridorInner,
          y: center.y + Math.sin(pad.normalAngle) * corridorInner
        };
        const centerEnd = {
          x: center.x + Math.cos(pad.normalAngle) * corridorOuter,
          y: center.y + Math.sin(pad.normalAngle) * corridorOuter
        };
        this.world.moveTo(centerStart.x, centerStart.y).lineTo(centerEnd.x, centerEnd.y).stroke({
          color: corridor.color,
          width: Math.max(1, corridor.width - 0.4),
          alpha: corridor.alpha * 0.46
        });
        for (const angle of [leftAngle, rightAngle]) {
          const start = {
            x: center.x + Math.cos(angle) * corridorInner,
            y: center.y + Math.sin(angle) * corridorInner
          };
          const end = {
            x: center.x + Math.cos(angle) * corridorOuter,
            y: center.y + Math.sin(angle) * corridorOuter
          };
          this.world.moveTo(start.x, start.y).lineTo(end.x, end.y).stroke({
            color: corridor.color,
            width: corridor.width,
            alpha: corridor.alpha
          });
        }
      }
      if (visual.haloAlpha > 0) {
        const haloRadius = pad.radius * visual.haloRadiusMultiplier;
        this.world.circle(center.x, center.y, haloRadius).fill({ color: visual.color, alpha: visual.haloAlpha * 0.48 });
        this.world.circle(center.x, center.y, haloRadius + 4).stroke({
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
    const trail = shipTrailVisual({
      status: snapshot.status,
      speed,
      fuelRatio,
      cargoDamage: snapshot.ship.cargoDamage,
      styleMultiplier: snapshot.styleMultiplier,
      styleChainSecondsRemaining: snapshot.styleChainSecondsRemaining
    });
    const boostBurst = boostBurstVisual({ status: snapshot.status, lastMilestone: snapshot.lastMilestone, tick: snapshot.tick });
    const boostSpark = boostSparkVisual({ status: snapshot.status, lastMilestone: snapshot.lastMilestone, tick: snapshot.tick });
    const boostReadiness = shipBoostReadinessVisual({
      status: snapshot.status,
      fuel: snapshot.ship.fuel,
      boostCooldownSeconds: snapshot.ship.boostCooldownSeconds,
      launchBurstSecondsRemaining: snapshot.launchBurstSecondsRemaining
    });
    const shieldReserve = shipShieldReserveVisual({
      status: snapshot.status,
      emergencyShieldAvailable: snapshot.emergencyShieldAvailable,
      tick: snapshot.tick
    });
    const cargoAura = cargoAuraVisual({
      status: snapshot.status,
      cargoOnboard: snapshot.cargoOnboard,
      cargoDamage: snapshot.ship.cargoDamage
    });
    const cargoFracture = cargoFractureVisual({
      status: snapshot.status,
      cargoOnboard: snapshot.cargoOnboard,
      cargoDamage: snapshot.ship.cargoDamage,
      tick: snapshot.tick
    });
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

    if (boostReadiness) {
      drawShipBoostReadinessRing(this.ship, center.x, center.y, boostReadiness);
    }

    if (shieldReserve) {
      this.ship.circle(center.x, center.y, shieldReserve.radius + 5).stroke({
        color: shieldReserve.color,
        width: 1,
        alpha: shieldReserve.alpha * 0.32
      });
      this.ship.circle(center.x, center.y, shieldReserve.radius).stroke({
        color: shieldReserve.color,
        width: shieldReserve.width,
        alpha: shieldReserve.alpha
      });
    }

    if (cargoAura) {
      this.ship.circle(center.x, center.y, cargoAura.radius + 6).stroke({
        color: cargoAura.color,
        width: 1,
        alpha: cargoAura.alpha * 0.34
      });
      this.ship.circle(center.x, center.y, cargoAura.radius).stroke({
        color: cargoAura.color,
        width: cargoAura.width,
        alpha: cargoAura.alpha
      });
    }

    if (cargoFracture) {
      for (let index = 0; index < cargoFracture.cracks; index += 1) {
        const angleOffset = cargoFracture.spin + (Math.PI * 2 * index) / cargoFracture.cracks;
        const start = {
          x: center.x + Math.cos(angleOffset) * cargoFracture.radius,
          y: center.y + Math.sin(angleOffset) * cargoFracture.radius
        };
        const kink = {
          x: start.x + Math.cos(angleOffset + 0.58) * cargoFracture.length * 0.48,
          y: start.y + Math.sin(angleOffset + 0.58) * cargoFracture.length * 0.48
        };
        const end = {
          x: kink.x + Math.cos(angleOffset - 0.42) * cargoFracture.length * 0.52,
          y: kink.y + Math.sin(angleOffset - 0.42) * cargoFracture.length * 0.52
        };
        this.ship.moveTo(start.x, start.y).lineTo(kink.x, kink.y).lineTo(end.x, end.y).stroke({
          color: cargoFracture.color,
          width: cargoFracture.width,
          alpha: cargoFracture.alpha
        });
      }
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

    if (boostSpark) {
      const rear = {
        x: center.x - Math.cos(angle) * 13,
        y: center.y - Math.sin(angle) * 13
      };
      const sparkCenter = (boostSpark.sparks - 1) / 2;
      for (let index = 0; index < boostSpark.sparks; index += 1) {
        const sparkOffset = index - sparkCenter;
        const sparkAngle = angle + Math.PI + sparkOffset * boostSpark.spread;
        const lengthScale = 1 - Math.abs(sparkOffset) * 0.12;
        const start = {
          x: rear.x + Math.cos(angle + Math.PI / 2) * sparkOffset * 3,
          y: rear.y + Math.sin(angle + Math.PI / 2) * sparkOffset * 3
        };
        const end = {
          x: start.x + Math.cos(sparkAngle) * boostSpark.length * lengthScale,
          y: start.y + Math.sin(sparkAngle) * boostSpark.length * lengthScale
        };
        this.ship.moveTo(start.x, start.y).lineTo(end.x, end.y).stroke({
          color: boostSpark.color,
          width: boostSpark.width,
          alpha: boostSpark.alpha * lengthScale
        });
      }
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

function drawObjectiveRouteBeam(guidance: Graphics, ship: Vec2, target: Vec2, visual: ObjectiveRouteBeamVisual): void {
  const delta = { x: target.x - ship.x, y: target.y - ship.y };
  const length = Math.hypot(delta.x, delta.y);
  if (length < 1) {
    return;
  }

  guidance.moveTo(ship.x, ship.y).lineTo(target.x, target.y).stroke({
    color: visual.color,
    width: visual.width + 2,
    alpha: visual.alpha * 0.18
  });

  for (let index = 0; index < visual.nodes; index += 1) {
    const fraction = 0.12 + positiveModulo((index + visual.flow) / visual.nodes, 1) * 0.76;
    const point = {
      x: ship.x + delta.x * fraction,
      y: ship.y + delta.y * fraction
    };
    const activeScale = index === visual.nodes - 1 ? 1.16 : 1;
    guidance.circle(point.x, point.y, visual.nodeRadius * activeScale).fill({
      color: visual.color,
      alpha: visual.alpha
    });
    guidance.circle(point.x, point.y, visual.nodeRadius * activeScale + 3).stroke({
      color: visual.color,
      width: 1,
      alpha: visual.alpha * 0.34
    });
  }
}

function drawObjectiveDockGate(guidance: Graphics, x: number, y: number, visual: ObjectiveDockGateVisual): void {
  const segmentAngle = (Math.PI * 2) / visual.segments;
  const halfSpan = segmentAngle * (visual.tone === "open" || visual.tone === "assist" ? 0.23 : 0.15);
  for (let segment = 0; segment < visual.segments; segment += 1) {
    const center = -Math.PI / 2 + segment * segmentAngle;
    for (let step = 0; step <= 4; step += 1) {
      const angle = center - halfSpan + (halfSpan * 2 * step) / 4;
      const point = {
        x: x + Math.cos(angle) * visual.radius,
        y: y + Math.sin(angle) * visual.radius
      };
      if (step === 0) {
        guidance.moveTo(point.x, point.y);
      } else {
        guidance.lineTo(point.x, point.y);
      }
    }
  }
  guidance.stroke({ color: visual.color, width: visual.width, alpha: visual.alpha });
}

function drawShipBoostReadinessRing(ship: Graphics, x: number, y: number, visual: ShipBoostReadinessVisual): void {
  const totalSegments = BOOST_READINESS_SEGMENTS;
  const segmentAngle = (Math.PI * 2) / totalSegments;
  const halfSpan = segmentAngle * 0.24;
  for (let segment = 0; segment < Math.min(visual.segments, totalSegments); segment += 1) {
    const center = -Math.PI / 2 + segment * segmentAngle;
    for (let step = 0; step <= 3; step += 1) {
      const angle = center - halfSpan + (halfSpan * 2 * step) / 3;
      const point = {
        x: x + Math.cos(angle) * visual.radius,
        y: y + Math.sin(angle) * visual.radius
      };
      if (step === 0) {
        ship.moveTo(point.x, point.y);
      } else {
        ship.lineTo(point.x, point.y);
      }
    }
  }
  ship.stroke({ color: visual.color, width: visual.width, alpha: visual.alpha });
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
