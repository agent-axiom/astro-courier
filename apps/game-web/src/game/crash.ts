import type { CrashReason } from "@astro-courier/shared";

export type CrashReasonLabelInput = {
  contractId?: string;
  crashReason?: CrashReason;
  landingRating?: string;
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

  if (input.crashReason === "Hull Collision") {
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

  if (input.crashReason === "Hull Collision") {
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
