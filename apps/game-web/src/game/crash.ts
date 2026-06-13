import type { CrashReason } from "@astro-courier/shared";

export type CrashReasonLabelInput = {
  contractId?: string;
  crashReason?: CrashReason;
  landingRating?: string;
};

export type CrashDebrief = {
  label: "Failure debrief";
  value: string;
  tone: "dock" | "impact" | "review";
};

export function buildCrashReasonLabel(input: CrashReasonLabelInput): string {
  if (input.crashReason === "Hard Landing") {
    return "Hard landing: slow and align before contact";
  }

  if (input.crashReason === "Hull Collision") {
    return input.contractId === "chain-relay"
      ? "Hull collision: widen relay clearance"
      : input.contractId === "asteroid-sprint"
      ? "Hull collision: widen asteroid clearance"
      : input.contractId === "return-leg"
      ? "Hull collision: widen reverse arc"
      : "Hull collision: stay outside gravity wells";
  }

  return input.landingRating ?? "Insurance Event";
}

export function buildCrashDebrief(input: CrashReasonLabelInput): CrashDebrief {
  if (input.crashReason === "Hard Landing") {
    return {
      label: "Failure debrief",
      value: "Brake window missed",
      tone: "dock"
    };
  }

  if (input.crashReason === "Hull Collision") {
    return {
      label: "Failure debrief",
      value:
        input.contractId === "chain-relay"
          ? "Relay lane clipped"
          : input.contractId === "asteroid-sprint"
          ? "Asteroid field clipped"
          : input.contractId === "return-leg"
          ? "Reverse arc clipped"
          : "Gravity well clipped",
      tone: "impact"
    };
  }

  return {
    label: "Failure debrief",
    value: "Insurance review",
    tone: "review"
  };
}
