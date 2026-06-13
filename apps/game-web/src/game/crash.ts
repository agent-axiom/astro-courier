import type { CrashReason } from "@astro-courier/shared";

export type CrashReasonLabelInput = {
  contractId?: string;
  crashReason?: CrashReason;
  landingRating?: string;
};

export function buildCrashReasonLabel(input: CrashReasonLabelInput): string {
  if (input.crashReason === "Hard Landing") {
    return "Hard landing: slow and align before contact";
  }

  if (input.crashReason === "Hull Collision") {
    return input.contractId === "asteroid-sprint"
      ? "Hull collision: widen asteroid clearance"
      : "Hull collision: stay outside gravity wells";
  }

  return input.landingRating ?? "Insurance Event";
}
