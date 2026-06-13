import type { ObjectivePhase, RunStatus } from "@astro-courier/shared";
import type { ContractPaceTier } from "./pace";

export type RunIntensity = "stealth" | "alarm" | "lockdown";

export type RunIntensityInput = {
  status: RunStatus;
  preflightOpen: boolean;
  fuelRatio: number;
  objectivePhase?: ObjectivePhase;
  paceTier?: ContractPaceTier;
  paceSecondsRemaining?: number;
  cargoDamage?: number;
  hazardDangerLevel?: "near" | "inside";
  trajectoryRiskLevel?: "near" | "inside";
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
};

export function buildRunIntensity(input: RunIntensityInput): RunIntensity {
  if (input.preflightOpen || input.status === "paused" || input.status === "delivered") {
    return "stealth";
  }

  if (
    input.status === "crashed" ||
    input.fuelRatio <= 0.15 ||
    input.hazardDangerLevel === "inside" ||
    input.trajectoryRiskLevel === "inside" ||
    isClosingExpressWindow(input) ||
    isStyleChainClosing(input)
  ) {
    return "lockdown";
  }

  if (input.fuelRatio <= 0.25 || input.hazardDangerLevel === "near" || input.trajectoryRiskLevel === "near") {
    return "alarm";
  }

  return "stealth";
}

function isClosingExpressWindow(input: RunIntensityInput): boolean {
  return (
    input.objectivePhase === "delivery" &&
    input.paceTier === "gold" &&
    (input.paceSecondsRemaining ?? 0) > 0 &&
    (input.paceSecondsRemaining ?? 0) <= 4 &&
    (input.cargoDamage ?? 0) <= 0.02
  );
}

function isStyleChainClosing(input: RunIntensityInput): boolean {
  const secondsRemaining = input.styleChainSecondsRemaining ?? 0;
  return (input.styleMultiplier ?? 1) > 1 && secondsRemaining > 0 && secondsRemaining <= 1;
}
