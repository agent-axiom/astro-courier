import { CONTROLLED_DOCK_SPEED_RATIO, PERFECT_APPROACH_STREAK_SECONDS, PERFECT_APPROACH_STYLE_BONUS } from "@astro-courier/simulation";
import type { LandingGuidanceStatus } from "@astro-courier/shared";

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

const FINAL_APPROACH_BRAKE_DISTANCE = 70;

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
