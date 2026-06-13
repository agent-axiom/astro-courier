import { PERFECT_APPROACH_STREAK_SECONDS, PERFECT_APPROACH_STYLE_BONUS } from "@astro-courier/simulation";

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

const FINAL_APPROACH_BRAKE_DISTANCE = 70;

export function buildDockingSpeedReadout(input: DockingSpeedReadoutInput): DockingSpeedReadout | undefined {
  if (input.allowedSpeed === undefined) {
    return undefined;
  }

  const speedValue = `${input.speed.toFixed(1)} / ${input.allowedSpeed.toFixed(1)}`;
  const overLimit = input.speed > input.allowedSpeed;
  const finalApproach = input.targetDistance !== undefined && input.targetDistance <= FINAL_APPROACH_BRAKE_DISTANCE;

  return {
    label: "Dock speed",
    value: overLimit && finalApproach ? `Brake now ${speedValue}` : speedValue,
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
