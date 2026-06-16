import { CONTROLLED_DOCK_SPEED_RATIO, PERFECT_APPROACH_STREAK_SECONDS, PERFECT_APPROACH_STYLE_BONUS } from "@astro-courier/simulation";
import type { LandingGuidanceStatus, ObjectivePhase, RunStatus } from "@astro-courier/shared";

export type DockingSpeedReadoutInput = {
  speed: number;
  allowedSpeed?: number;
  targetDistance?: number;
};

export type DockingSpeedReadout = {
  label: "Dock speed";
  value: string;
  tone: "normal" | "over-limit";
};

export type ApproachRewardReadoutInput = {
  approachStreakSeconds: number;
};

export type ApproachRewardReadout = {
  label: "Perfect setup";
  value: string;
  tone: "charging" | "ready";
  progress: number;
};

export type LandingGuidanceLabelInput = {
  status: LandingGuidanceStatus;
  assistAvailable?: boolean;
  speed?: number;
  allowedSpeed?: number;
  angleError?: number;
  requiredAngleTolerance?: number;
};

export type LandingGuidancePresentation = {
  label: string;
  tone: "approach" | "too-fast" | "misaligned" | "ready" | "soft" | "assist";
};

export type DockingLanePresentationInput = {
  status: RunStatus;
  objectivePhase: ObjectivePhase;
  targetDistance?: number;
  landingStatus?: LandingGuidanceStatus;
  speed: number;
  allowedSpeed?: number;
  approachStreakSeconds?: number;
  assistAvailable?: boolean;
};

export type DockingLaneSegment = {
  label: "Align" | "Brake" | "Touch";
  state: "locked" | "warning" | "danger" | "ready";
};

export type DockingLanePresentation = {
  label: "Dock lane";
  action: string;
  detail: string;
  tone: "approach" | "warning" | "danger" | "ready" | "assist";
  progress: number;
  segments: DockingLaneSegment[];
  reward?: string;
};

const FINAL_APPROACH_BRAKE_DISTANCE = 70;
const DOCKING_LANE_DISTANCE = 120;

export function buildLandingGuidanceLabel(input: LandingGuidanceLabelInput): string {
  return buildLandingGuidancePresentation(input).label;
}

export function buildLandingGuidancePresentation(input: LandingGuidanceLabelInput): LandingGuidancePresentation {
  if (input.assistAvailable) return { label: "Assist ready", tone: "assist" };
  if (input.status === "ready" && isSoftDockReady(input)) return { label: "Soft dock", tone: "soft" };
  if (input.status === "ready") return { label: "Dock ready", tone: "ready" };
  if (input.status === "too-fast") return { label: "Slow for clean", tone: "too-fast" };
  if (input.status === "misaligned") return { label: "Align for clean", tone: "misaligned" };
  return { label: "Line up", tone: "approach" };
}

function isSoftDockReady(input: LandingGuidanceLabelInput): boolean {
  return (
    input.speed !== undefined &&
    input.allowedSpeed !== undefined &&
    input.angleError !== undefined &&
    input.requiredAngleTolerance !== undefined &&
    input.speed <= input.allowedSpeed * CONTROLLED_DOCK_SPEED_RATIO &&
    input.angleError > input.requiredAngleTolerance
  );
}

export function buildDockingSpeedReadout(input: DockingSpeedReadoutInput): DockingSpeedReadout | undefined {
  if (input.allowedSpeed === undefined) {
    return undefined;
  }

  const speedValue = `${input.speed.toFixed(1)} / ${input.allowedSpeed.toFixed(1)}`;
  const overLimit = input.speed > input.allowedSpeed;
  const finalApproach = input.targetDistance !== undefined && input.targetDistance <= FINAL_APPROACH_BRAKE_DISTANCE;

  return {
    label: "Dock speed",
    value: overLimit && finalApproach ? `Slow for clean ${speedValue}` : speedValue,
    tone: overLimit ? "over-limit" : "normal"
  };
}

export function buildApproachRewardReadout(input: ApproachRewardReadoutInput): ApproachRewardReadout | undefined {
  if (input.approachStreakSeconds < 0.25) {
    return undefined;
  }

  if (input.approachStreakSeconds >= PERFECT_APPROACH_STREAK_SECONDS) {
    return {
      label: "Perfect setup",
      value: `+${PERFECT_APPROACH_STYLE_BONUS} ready`,
      tone: "ready",
      progress: 1
    };
  }

  return {
    label: "Perfect setup",
    value: `${input.approachStreakSeconds.toFixed(1)} / ${PERFECT_APPROACH_STREAK_SECONDS.toFixed(1)}s`,
    tone: "charging",
    progress: round(clamp(input.approachStreakSeconds / PERFECT_APPROACH_STREAK_SECONDS, 0, 1), 2)
  };
}

export function buildDockingLanePresentation(input: DockingLanePresentationInput): DockingLanePresentation | undefined {
  if (
    input.status !== "flying" ||
    input.objectivePhase !== "delivery" ||
    input.targetDistance === undefined ||
    input.targetDistance > DOCKING_LANE_DISTANCE ||
    input.landingStatus === undefined ||
    input.landingStatus === "approach"
  ) {
    return undefined;
  }

  const progress = round(clamp(1 - input.targetDistance / DOCKING_LANE_DISTANCE, 0, 1), 2);
  const distanceDetail = `${Math.round(input.targetDistance)}m / ${input.speed.toFixed(1)}`;

  if (input.assistAvailable) {
    return {
      label: "Dock lane",
      action: "Assist ready",
      detail: distanceDetail,
      tone: "assist",
      progress,
      segments: readySegments(),
      reward: buildDockingLaneReward(input.approachStreakSeconds)
    };
  }

  if (input.landingStatus === "ready") {
    return {
      label: "Dock lane",
      action: "Land now",
      detail: distanceDetail,
      tone: "ready",
      progress,
      segments: readySegments(),
      reward: buildDockingLaneReward(input.approachStreakSeconds)
    };
  }

  if (input.landingStatus === "too-fast") {
    return {
      label: "Dock lane",
      action: "Brake",
      detail: input.allowedSpeed === undefined ? input.speed.toFixed(1) : `${input.speed.toFixed(1)} / ${input.allowedSpeed.toFixed(1)}`,
      tone: "danger",
      progress,
      segments: [
        { label: "Align", state: "ready" },
        { label: "Brake", state: "danger" },
        { label: "Touch", state: "locked" }
      ]
    };
  }

  return {
    label: "Dock lane",
    action: "Align",
    detail: distanceDetail,
    tone: "warning",
    progress,
    segments: [
      { label: "Align", state: "warning" },
      { label: "Brake", state: input.allowedSpeed !== undefined && input.speed > input.allowedSpeed ? "danger" : "ready" },
      { label: "Touch", state: "locked" }
    ]
  };
}

function readySegments(): DockingLaneSegment[] {
  return [
    { label: "Align", state: "ready" },
    { label: "Brake", state: "ready" },
    { label: "Touch", state: "ready" }
  ];
}

function buildDockingLaneReward(approachStreakSeconds: number | undefined): string | undefined {
  return approachStreakSeconds !== undefined && approachStreakSeconds >= PERFECT_APPROACH_STREAK_SECONDS
    ? `+${PERFECT_APPROACH_STYLE_BONUS} setup`
    : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
