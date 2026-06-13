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
