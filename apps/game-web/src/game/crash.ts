import type { CrashReason } from "@astro-courier/shared";

export type CrashReasonLabelInput = {
  contractId?: string;
  crashReason?: CrashReason;
  landingRating?: string;
  targetDistance?: number;
};

export type CrashDebrief = {
  label: "Cause";
  value: string;
  tone: "dock" | "impact" | "review";
};

export function buildCrashReasonLabel(input: CrashReasonLabelInput): string {
  if (input.crashReason === "Hard Landing") {
    return "Landed too fast";
  }

  if (input.crashReason === "Misaligned Dock") {
    return "Dock angle missed";
  }

  if (input.crashReason === "Hull Collision") {
    if (isCloseTargetHullCollision(input)) {
      return "Missed landing pad";
    }

    return input.contractId === "chain-relay"
      ? "Clipped relay lane"
      : input.contractId === "asteroid-sprint"
      ? "Clipped asteroid field"
      : input.contractId === "return-leg"
      ? "Clipped return arc"
      : "Clipped gravity well";
  }

  return input.landingRating ?? "Insurance Event";
}

export function buildCrashDebrief(input: CrashReasonLabelInput): CrashDebrief {
  if (input.crashReason === "Hard Landing") {
    return {
      label: "Cause",
      value: "Too fast",
      tone: "dock"
    };
  }

  if (input.crashReason === "Misaligned Dock") {
    return {
      label: "Cause",
      value: "Alignment",
      tone: "dock"
    };
  }

  if (input.crashReason === "Hull Collision") {
    if (isCloseTargetHullCollision(input)) {
      return {
        label: "Cause",
        value: "Pad approach",
        tone: "dock"
      };
    }

    return {
      label: "Cause",
      value:
        input.contractId === "chain-relay"
          ? "Relay lane"
          : input.contractId === "asteroid-sprint"
          ? "Asteroid field"
          : input.contractId === "return-leg"
          ? "Return arc"
          : "Gravity well",
      tone: "impact"
    };
  }

  return {
    label: "Cause",
    value: "Review",
    tone: "review"
  };
}

function isCloseTargetHullCollision(input: CrashReasonLabelInput): boolean {
  return input.crashReason === "Hull Collision" && input.targetDistance !== undefined && input.targetDistance <= 90;
}
