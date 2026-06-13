import { PERFECT_APPROACH_STREAK_SECONDS, PERFECT_APPROACH_STYLE_BONUS } from "@astro-courier/simulation";

export type DockingSpeedReadoutInput = {
  speed: number;
  allowedSpeed?: number;
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
};

export function buildDockingSpeedReadout(input: DockingSpeedReadoutInput): DockingSpeedReadout | undefined {
  if (input.allowedSpeed === undefined) {
    return undefined;
  }

  return {
    label: "Dock speed",
    value: `${input.speed.toFixed(1)} / ${input.allowedSpeed.toFixed(1)}`,
    tone: input.speed > input.allowedSpeed ? "over-limit" : "normal"
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
      tone: "ready"
    };
  }

  return {
    label: "Perfect setup",
    value: `${input.approachStreakSeconds.toFixed(1)} / ${PERFECT_APPROACH_STREAK_SECONDS.toFixed(1)}s`,
    tone: "charging"
  };
}
