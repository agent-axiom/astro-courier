import type { LandingGuidanceStatus, ObjectivePhase, RunStatus } from "@astro-courier/shared";

export type BearingGuidance = {
  label: "Target ahead" | "Target left" | "Target right" | "Turn around";
  value: string;
  tone: "ahead" | "side" | "reverse";
};

export type TargetCompassPresentationInput = {
  status: RunStatus;
  preflightOpen: boolean;
  objectivePhase: ObjectivePhase;
  targetDistance?: number;
  relativeBearing?: number;
  landingStatus?: LandingGuidanceStatus;
};

export type TargetCompassPresentation = {
  label: "Pickup" | "Dock";
  distance: string;
  tone: "pickup" | "delivery" | "ready" | "warning";
  angleDeg: number;
  progress: number;
};

const aheadThreshold = Math.PI / 8;
const reverseThreshold = Math.PI * 0.72;
const targetCompassRange = 420;
const targetCompassContactRange = 72;

export function formatBearingGuidance(relativeBearing: number): BearingGuidance {
  const normalized = normalizeAngle(relativeBearing);
  const degrees = `${Math.round(Math.abs((normalized * 180) / Math.PI))}deg`;
  const magnitude = Math.abs(normalized);

  if (magnitude <= aheadThreshold) {
    return { label: "Target ahead", value: degrees, tone: "ahead" };
  }
  if (magnitude >= reverseThreshold) {
    return { label: "Turn around", value: degrees, tone: "reverse" };
  }
  return {
    label: normalized < 0 ? "Target left" : "Target right",
    value: degrees,
    tone: "side"
  };
}

export function normalizeAngle(angle: number): number {
  let next = angle;
  while (next <= -Math.PI) next += Math.PI * 2;
  while (next > Math.PI) next -= Math.PI * 2;
  return next;
}

export function buildTargetCompassPresentation(input: TargetCompassPresentationInput): TargetCompassPresentation | undefined {
  if (
    input.preflightOpen ||
    input.status !== "flying" ||
    input.targetDistance === undefined ||
    input.relativeBearing === undefined
  ) {
    return undefined;
  }

  return {
    label: input.objectivePhase === "pickup" ? "Pickup" : "Dock",
    distance: `${Math.round(input.targetDistance)}m`,
    tone: targetCompassTone(input),
    angleDeg: Math.round((normalizeAngle(input.relativeBearing) * 180) / Math.PI),
    progress: round(clamp(1 - input.targetDistance / targetCompassRange, 0, 1), 2)
  };
}

function targetCompassTone(input: TargetCompassPresentationInput): TargetCompassPresentation["tone"] {
  const inContactRange = input.targetDistance !== undefined && input.targetDistance <= targetCompassContactRange;

  if (inContactRange && input.landingStatus === "ready") {
    return "ready";
  }

  if (inContactRange && (input.landingStatus === "too-fast" || input.landingStatus === "misaligned")) {
    return "warning";
  }

  return input.objectivePhase === "pickup" ? "pickup" : "delivery";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
