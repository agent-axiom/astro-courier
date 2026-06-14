import { PERFECT_APPROACH_STREAK_SECONDS, STYLE_CHAIN_WINDOW_SECONDS } from "@astro-courier/simulation";
import type { LandingGuidanceStatus, ObjectivePhase, RunStatus } from "@astro-courier/shared";
import type { ContractPaceTier } from "./pace";

export type RouteTempoInput = {
  status: RunStatus;
  preflightOpen: boolean;
  speed: number;
  fuelRatio: number;
  targetDistance?: number;
  objectivePhase?: ObjectivePhase;
  paceTier?: ContractPaceTier;
  paceSecondsRemaining?: number;
  cargoDamage?: number;
  landingStatus?: LandingGuidanceStatus;
  perfectDockReady?: boolean;
  approachStreakSeconds?: number;
  hazardDangerLevel?: "near" | "inside";
  trajectoryRiskLevel?: "near" | "inside";
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
};

export type RouteTempoReadout = {
  label: "Route tempo";
  value: string;
  tone: "clutch" | "danger" | "flow" | "push";
  progress: number;
};

const criticalFuelRatio = 0.15;
const cleanCargoDamageLimit = 0.02;
const chainCashoutSeconds = 1.2;
const expressCloseSeconds = 4;
const speedProgressTarget = 60;

export function buildRouteTempo(input: RouteTempoInput): RouteTempoReadout | undefined {
  if (input.preflightOpen || input.status !== "flying") {
    return undefined;
  }

  if (input.hazardDangerLevel === "inside" || input.trajectoryRiskLevel === "inside") {
    return routeTempo("Break vector", "danger", 1);
  }

  const chainSeconds = input.styleChainSecondsRemaining ?? 0;
  const chainActive = (input.styleMultiplier ?? 1) > 1 && chainSeconds > 0;
  if (chainActive && chainSeconds <= chainCashoutSeconds) {
    return routeTempo(
      `Cash chain / x${(input.styleMultiplier ?? 1).toFixed(2)} / ${chainSeconds.toFixed(1)}s`,
      "clutch",
      countdownProgress(chainSeconds, chainCashoutSeconds)
    );
  }

  const paceSeconds = input.paceSecondsRemaining ?? 0;
  if (
    input.objectivePhase === "delivery" &&
    input.paceTier === "gold" &&
    paceSeconds > 0 &&
    paceSeconds <= expressCloseSeconds &&
    (input.cargoDamage ?? 0) <= cleanCargoDamageLimit
  ) {
    return routeTempo(`Gold close / ${paceSeconds.toFixed(1)}s`, "clutch", countdownProgress(paceSeconds, expressCloseSeconds));
  }

  if (input.fuelRatio <= criticalFuelRatio) {
    return routeTempo(`Fuel critical / ${Math.round(input.fuelRatio * 100)}%`, "clutch", 1 - input.fuelRatio / criticalFuelRatio);
  }

  if (
    input.objectivePhase === "delivery" &&
    input.landingStatus === "ready" &&
    (input.cargoDamage ?? 0) <= cleanCargoDamageLimit &&
    (input.perfectDockReady || (input.approachStreakSeconds ?? 0) >= PERFECT_APPROACH_STREAK_SECONDS)
  ) {
    return routeTempo("Perfect flow / dock now", "flow", 1);
  }

  if (chainActive) {
    return routeTempo(
      `Flow chain / x${(input.styleMultiplier ?? 1).toFixed(2)}`,
      "flow",
      chainSeconds / STYLE_CHAIN_WINDOW_SECONDS
    );
  }

  if (input.targetDistance !== undefined && input.speed > 0) {
    const etaSeconds = Math.max(0, input.targetDistance / input.speed);
    return routeTempo(`ETA ${etaSeconds.toFixed(1)}s / speed ${Math.round(input.speed)}`, "push", input.speed / speedProgressTarget);
  }

  return routeTempo(`Build speed / ${Math.round(input.speed)}`, "push", input.speed / speedProgressTarget);
}

export function buildRouteTempoShellClass(routeTempo: RouteTempoReadout | undefined): string {
  return routeTempo ? `app-route-tempo-${routeTempo.tone}` : "app-route-tempo-none";
}

function routeTempo(value: string, tone: RouteTempoReadout["tone"], progress: number): RouteTempoReadout {
  return {
    label: "Route tempo",
    value,
    tone,
    progress: round(clamp(progress, 0, 1), 2)
  };
}

function countdownProgress(seconds: number, windowSeconds: number): number {
  return 1 - seconds / windowSeconds;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
