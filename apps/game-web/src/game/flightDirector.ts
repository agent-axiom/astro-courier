import { HAZARD_THREAD_SPEED_THRESHOLD } from "@astro-courier/simulation";
import type { LandingGuidanceStatus, ObjectivePhase, RunStatus } from "@astro-courier/shared";

export type FlightDirectorInput = {
  status: RunStatus;
  objectivePhase: ObjectivePhase;
  cargoOnboard: boolean;
  targetDistance?: number;
  speed?: number;
  landingStatus?: LandingGuidanceStatus;
  trajectoryRiskLevel?: "near" | "inside";
  trajectoryRiskSeconds?: number;
  hazardDangerLevel?: "near" | "inside";
  quickPickupSecondsRemaining?: number;
  quickPickupBonus?: number;
  gravitySlingReady?: boolean;
  gravitySlingStyleBonus?: number;
  cargoDamage?: number;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
};

export type FlightDirector = {
  label: "Flight director";
  action: string;
  detail: string;
  tone: "approach" | "danger" | "idle" | "opportunity" | "urgent";
  progress: number;
};

const CHAIN_CASHOUT_SECONDS = 1.2;
const TRAJECTORY_WARNING_SECONDS = 3;
const TARGET_PROGRESS_DISTANCE = 400;
const QUICK_PICKUP_WINDOW_SECONDS = 12;

export function buildFlightDirector(input: FlightDirectorInput): FlightDirector | undefined {
  if (input.status === "delivered" || input.status === "crashed") {
    return undefined;
  }

  if (input.status === "paused") {
    return director("Commit route", "Launch when ready", "idle", 0);
  }

  if (input.hazardDangerLevel === "inside") {
    return director("Burn out", "Hazard contact", "danger", 1);
  }

  if (input.trajectoryRiskLevel === "inside") {
    const seconds = input.trajectoryRiskSeconds ?? 0;
    return director("Evade vector", `Impact in ${formatSeconds(seconds)}`, "danger", countdownProgress(seconds, TRAJECTORY_WARNING_SECONDS));
  }

  if (input.landingStatus === "too-fast") {
    return director("Brake hard", "Dock speed high", "danger", 1);
  }

  if (input.trajectoryRiskLevel === "near") {
    const seconds = input.trajectoryRiskSeconds ?? 0;
    if ((input.cargoDamage ?? 0) > 0.02) {
      return director("Clear vector", `Cargo exposed / ${formatSeconds(seconds)}`, "urgent", countdownProgress(seconds, TRAJECTORY_WARNING_SECONDS));
    }

    return director(
      (input.speed ?? 0) >= HAZARD_THREAD_SPEED_THRESHOLD ? "Thread vector" : "Skim vector",
      `Edge in ${formatSeconds(seconds)}`,
      "opportunity",
      countdownProgress(seconds, TRAJECTORY_WARNING_SECONDS)
    );
  }

  const chainSeconds = input.styleChainSecondsRemaining ?? 0;
  if ((input.styleMultiplier ?? 1) > 1 && chainSeconds > 0 && chainSeconds <= CHAIN_CASHOUT_SECONDS) {
    return director(
      "Cash chain",
      `x${(input.styleMultiplier ?? 1).toFixed(2)} / ${formatSeconds(chainSeconds)}`,
      "urgent",
      countdownProgress(chainSeconds, CHAIN_CASHOUT_SECONDS)
    );
  }

  if (input.gravitySlingReady === true && (input.gravitySlingStyleBonus ?? 0) > 0 && (input.cargoDamage ?? 0) <= 0.02) {
    const payout = Math.round((input.gravitySlingStyleBonus ?? 0) * Math.max(1, input.styleMultiplier ?? 1));
    return director("Hold sling", `+${payout} ready`, "opportunity", 1);
  }

  if (input.landingStatus === "ready" && input.objectivePhase === "delivery") {
    return director("Dock now", (input.cargoDamage ?? 0) <= 0.02 ? "Clean cargo" : "Salvage cargo", "approach", 1);
  }

  const quickPickupSeconds = input.quickPickupSecondsRemaining ?? 0;
  if (input.objectivePhase === "pickup" && quickPickupSeconds > 0 && (input.quickPickupBonus ?? 0) > 0) {
    return director(
      "Load fast",
      `+${Math.round(input.quickPickupBonus ?? 0)} / ${formatSeconds(quickPickupSeconds)}`,
      "opportunity",
      countdownProgress(quickPickupSeconds, QUICK_PICKUP_WINDOW_SECONDS)
    );
  }

  if (input.objectivePhase === "pickup") {
    return director("Acquire cargo", input.targetDistance === undefined ? "Find pickup" : `Target ${Math.round(input.targetDistance)}m`, "approach", targetProgress(input));
  }

  return director("Deliver cargo", input.targetDistance === undefined ? "Find destination" : `Target ${Math.round(input.targetDistance)}m`, "approach", targetProgress(input));
}

function director(action: string, detail: string, tone: FlightDirector["tone"], progress: number): FlightDirector {
  return {
    label: "Flight director",
    action,
    detail,
    tone,
    progress: round(clamp(progress, 0, 1), 2)
  };
}

function targetProgress(input: FlightDirectorInput): number {
  if (input.targetDistance === undefined) {
    return 0;
  }

  return clamp(1 - input.targetDistance / TARGET_PROGRESS_DISTANCE, 0, 1);
}

function countdownProgress(seconds: number, windowSeconds: number): number {
  return clamp(1 - seconds / windowSeconds, 0, 1);
}

function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
