import type { ObjectivePhase, RunStatus } from "@astro-courier/shared";
import { isLiveCometDockArmed } from "./comet";
import type { ContractPaceTier } from "./pace";

export type GameAudioEvent =
  | "delivery-complete"
  | "ship-crash"
  | "style-hit"
  | "launch-burst"
  | "cargo-loaded"
  | "pb-pressure"
  | "pb-lead"
  | "ghost-pressure"
  | "ghost-pass"
  | "comet-armed"
  | "chain-critical"
  | "medal-drop"
  | "assist-burn"
  | "boost-burn"
  | "fuel-critical"
  | "cargo-damage"
  | "hazard-contact"
  | "trajectory-warning";

export type HudAudioSnapshot = {
  status: RunStatus;
  objectivePhase?: ObjectivePhase;
  lastMilestone?: string;
  score?: number;
  bestRunScore?: number;
  bestRunHasGhostTrail?: boolean;
  paceTier?: ContractPaceTier;
  perfectDockReady?: boolean;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
  fuel: number;
  maxFuel: number;
  cargoDamage?: number;
  hazardDangerLevel?: "near" | "inside";
  trajectoryRiskLevel?: "near" | "inside";
};

const criticalFuelRatio = 0.15;
const cleanCargoDamageLimit = 0.02;
const criticalStyleChainSeconds = 1;
const bestRunPressureGap = 200;
const styleMilestones = new Set([
  "Clean Hazard Skim",
  "Needle Thread",
  "Gravity Sling",
  "Quick Pickup",
  "Launch Burst",
  "Comet Finish",
  "Perfect Approach",
  "Eco Drift",
  "Chain Finish",
  "Express Finish",
  "Damage Control",
  "Last Drop",
  "No Brake Finesse"
]);

export function deriveHudAudioEvents(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): GameAudioEvent[] {
  const events: GameAudioEvent[] = [];

  if (previous?.status !== current.status) {
    if (current.status === "delivered") {
      events.push("delivery-complete");
    } else if (current.status === "crashed") {
      events.push("ship-crash");
    }
  }

  if (current.lastMilestone && previous?.lastMilestone !== current.lastMilestone) {
    if (current.lastMilestone === "Assist Burn") {
      events.push("assist-burn");
    } else if (current.lastMilestone === "Boost Burn") {
      events.push("boost-burn");
    } else if (current.lastMilestone === "Launch Burst") {
      events.push("launch-burst");
    } else if (styleMilestones.has(current.lastMilestone)) {
      events.push("style-hit");
    }
  }

  if (previous?.objectivePhase === "pickup" && current.objectivePhase === "delivery") {
    events.push("cargo-loaded");
  }

  if (!isFuelCritical(previous) && isFuelCritical(current)) {
    events.push("fuel-critical");
  }

  if (hasCargoDamageCrossedCleanLimit(previous, current)) {
    events.push("cargo-damage");
  }

  if (hasDroppedMedalWindow(previous, current)) {
    events.push("medal-drop");
  }

  if (hasCrossedBestRunScore(previous, current)) {
    events.push(current.bestRunHasGhostTrail ? "ghost-pass" : "pb-lead");
  }

  if (hasEnteredBestRunPressure(previous, current)) {
    events.push(current.bestRunHasGhostTrail ? "ghost-pressure" : "pb-pressure");
  }

  if (hasArmedCometDock(previous, current)) {
    events.push("comet-armed");
  }

  if (hasStyleChainReachedCriticalWindow(previous, current)) {
    events.push("chain-critical");
  }

  if (previous?.hazardDangerLevel !== "inside" && current.hazardDangerLevel === "inside") {
    events.push("hazard-contact");
  }

  if (previous?.trajectoryRiskLevel !== current.trajectoryRiskLevel && current.trajectoryRiskLevel === "inside") {
    events.push("trajectory-warning");
  } else if (
    previous?.trajectoryRiskLevel !== current.trajectoryRiskLevel &&
    current.trajectoryRiskLevel === "near" &&
    (current.cargoDamage ?? 0) > cleanCargoDamageLimit
  ) {
    events.push("trajectory-warning");
  }

  return events;
}

function isFuelCritical(snapshot: HudAudioSnapshot | undefined): boolean {
  if (!snapshot || snapshot.maxFuel <= 0) {
    return false;
  }
  return snapshot.fuel / snapshot.maxFuel <= criticalFuelRatio;
}

function hasCargoDamageCrossedCleanLimit(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  if (!previous) {
    return false;
  }
  return (previous.cargoDamage ?? 0) <= cleanCargoDamageLimit && (current.cargoDamage ?? 0) > cleanCargoDamageLimit;
}

function hasCrossedBestRunScore(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  if (!previous || current.bestRunScore === undefined || previous.bestRunScore !== current.bestRunScore) {
    return false;
  }
  return (previous.score ?? 0) <= current.bestRunScore && (current.score ?? 0) > current.bestRunScore;
}

function hasEnteredBestRunPressure(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  if (!previous || current.bestRunScore === undefined || previous.bestRunScore !== current.bestRunScore) {
    return false;
  }

  const previousGap = current.bestRunScore - (previous.score ?? 0);
  const currentGap = current.bestRunScore - (current.score ?? 0);
  return previousGap > bestRunPressureGap && currentGap > 0 && currentGap <= bestRunPressureGap;
}

function hasArmedCometDock(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  if (!previous || previous.perfectDockReady || !current.perfectDockReady) {
    return false;
  }
  return isLiveCometDockArmed(current);
}

function hasDroppedMedalWindow(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  if (!previous?.paceTier || !current.paceTier) {
    return false;
  }
  return paceTierRank(current.paceTier) > paceTierRank(previous.paceTier);
}

function hasStyleChainReachedCriticalWindow(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  const currentChainActive = (current.styleMultiplier ?? 1) > 1 && (current.styleChainSecondsRemaining ?? 0) > 0;
  if (!previous || !currentChainActive) {
    return false;
  }
  return (
    (previous.styleChainSecondsRemaining ?? 0) > criticalStyleChainSeconds &&
    (current.styleChainSecondsRemaining ?? 0) <= criticalStyleChainSeconds
  );
}

function paceTierRank(tier: ContractPaceTier): number {
  if (tier === "gold") return 0;
  if (tier === "silver") return 1;
  if (tier === "bronze") return 2;
  return 3;
}
