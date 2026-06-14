import { HAZARD_THREAD_SPEED_THRESHOLD, LAST_DROP_FUEL_RATIO, PERFECT_APPROACH_STREAK_SECONDS } from "@astro-courier/simulation";
import type { LandingGuidanceStatus, ObjectivePhase, RunStatus } from "@astro-courier/shared";
import { COMET_RESERVE_MIN_RATIO, COMET_RESERVE_WARNING_RATIO, isLiveCometDockArmed } from "./comet";
import type { ContractPaceTier } from "./pace";

export type GameAudioEvent =
  | "delivery-complete"
  | "ship-crash"
  | "style-hit"
  | "antimatter-drift"
  | "antimatter-armed"
  | "launch-burst"
  | "cargo-loaded"
  | "pickup-lineup"
  | "dock-lineup"
  | "pb-pressure"
  | "pb-lead"
  | "ghost-pressure"
  | "ghost-pass"
  | "comet-armed"
  | "perfect-approach-ready"
  | "last-drop-armed"
  | "express-close"
  | "comet-reserve-tight"
  | "comet-reserve-lost"
  | "chain-critical"
  | "chain-save"
  | "medal-drop"
  | "assist-burn"
  | "boost-burn"
  | "fuel-critical"
  | "cargo-shock"
  | "cargo-stress"
  | "cargo-damage"
  | "hazard-contact"
  | "thread-window"
  | "clean-escape"
  | "trajectory-warning"
  | "trajectory-caution"
  | "trajectory-clear";

export type HudAudioSnapshot = {
  status: RunStatus;
  contractId?: string;
  objectivePhase?: ObjectivePhase;
  lastMilestone?: string;
  score?: number;
  speed?: number;
  targetDistance?: number;
  bestRunScore?: number;
  bestRunHasGhostTrail?: boolean;
  paceTier?: ContractPaceTier;
  paceSecondsRemaining?: number;
  perfectDockReady?: boolean;
  landingStatus?: LandingGuidanceStatus;
  approachStreakSeconds?: number;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
  fuel: number;
  maxFuel: number;
  cargoKind?: string;
  cargoDamage?: number;
  manualBrakeUsed?: boolean;
  hazardDangerLevel?: "near" | "inside";
  trajectoryRiskLevel?: "near" | "inside";
};

const criticalFuelRatio = 0.15;
const cleanCargoDamageLimit = 0.02;
const criticalStyleChainSeconds = 1;
const expressCloseSeconds = 4;
const bestRunPressureGap = 200;
const closeTargetDistance = 90;
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
  "No Brake Finesse",
  "Antimatter Drift"
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
    } else if (current.lastMilestone === "Antimatter Drift") {
      events.push("antimatter-drift");
    } else if (styleMilestones.has(current.lastMilestone)) {
      events.push("style-hit");
    }
  }

  if (previous?.objectivePhase === "pickup" && current.objectivePhase === "delivery") {
    events.push("cargo-loaded");
  }

  const lineupEvent = buildTargetLineupEvent(previous, current);
  if (lineupEvent) {
    events.push(lineupEvent);
  }

  if (!isFuelCritical(previous) && isFuelCritical(current)) {
    events.push("fuel-critical");
  }

  const cargoStressStarted = hasCargoStressStarted(previous, current);
  if (cargoStressStarted) {
    events.push(current.cargoKind === "volatile" ? "cargo-shock" : "cargo-stress");
  }

  if (hasCargoDamageCrossedCleanLimit(previous, current)) {
    events.push("cargo-damage");
  }

  if (hasDroppedMedalWindow(previous, current)) {
    events.push("medal-drop");
  }

  if (hasEnteredExpressCloseWindow(previous, current)) {
    events.push("express-close");
  }

  if (hasCrossedBestRunScore(previous, current)) {
    events.push(current.bestRunHasGhostTrail ? "ghost-pass" : "pb-lead");
  }

  if (hasEnteredBestRunPressure(previous, current)) {
    events.push(current.bestRunHasGhostTrail ? "ghost-pressure" : "pb-pressure");
  }

  const cometDockArmed = hasArmedCometDock(previous, current);
  if (cometDockArmed) {
    events.push("comet-armed");
  } else if (hasArmedLastDrop(previous, current)) {
    events.push("last-drop-armed");
  } else if (hasArmedAntimatterDrift(previous, current)) {
    events.push("antimatter-armed");
  } else if (hasArmedPerfectApproach(previous, current)) {
    events.push("perfect-approach-ready");
  }

  if (hasEnteredTightCometReserve(previous, current)) {
    events.push("comet-reserve-tight");
  }

  if (hasLostCometReserve(previous, current)) {
    events.push("comet-reserve-lost");
  }

  if (hasStyleChainReachedCriticalWindow(previous, current)) {
    events.push("chain-critical");
  }

  if (hasStyleChainBeenSaved(previous, current)) {
    events.push("chain-save");
  }

  if (previous?.hazardDangerLevel !== "inside" && current.hazardDangerLevel === "inside") {
    events.push("hazard-contact");
  }

  if (previous?.trajectoryRiskLevel !== current.trajectoryRiskLevel && current.trajectoryRiskLevel === "inside") {
    events.push("trajectory-warning");
  } else if (!isThreadWindowOpen(previous) && isThreadWindowOpen(current)) {
    events.push("thread-window");
  } else if (previous?.trajectoryRiskLevel !== current.trajectoryRiskLevel && current.trajectoryRiskLevel === "near") {
    const damagedCargo = (current.cargoDamage ?? 0) > cleanCargoDamageLimit;
    if (damagedCargo) {
      events.push("trajectory-warning");
    } else {
      events.push("trajectory-caution");
    }
  } else if (hasCleanEscapedTrajectoryRisk(previous, current)) {
    events.push("clean-escape");
  } else if (hasClearedTrajectoryRisk(previous, current)) {
    events.push("trajectory-clear");
  }

  return events;
}

function isThreadWindowOpen(snapshot: HudAudioSnapshot | undefined): boolean {
  return (
    snapshot?.status === "flying" &&
    snapshot.trajectoryRiskLevel === "near" &&
    (snapshot.cargoDamage ?? 0) <= cleanCargoDamageLimit &&
    (snapshot.speed ?? 0) >= HAZARD_THREAD_SPEED_THRESHOLD
  );
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

function hasCargoStressStarted(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  if (!previous) {
    return false;
  }

  const previousDamage = previous.cargoDamage ?? 0;
  const currentDamage = current.cargoDamage ?? 0;
  return previousDamage <= 0 && currentDamage > 0 && currentDamage <= cleanCargoDamageLimit;
}

function buildTargetLineupEvent(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): GameAudioEvent | undefined {
  if (!previous || current.status !== "flying" || current.targetDistance === undefined || current.objectivePhase === undefined) {
    return undefined;
  }
  if (previous.objectivePhase !== current.objectivePhase) {
    return undefined;
  }

  const previousDistance = previous.targetDistance ?? Number.POSITIVE_INFINITY;
  if (previousDistance <= closeTargetDistance || current.targetDistance > closeTargetDistance) {
    return undefined;
  }

  return current.objectivePhase === "pickup" ? "pickup-lineup" : "dock-lineup";
}

function hasClearedTrajectoryRisk(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  return (
    current.status === "flying" &&
    (previous?.trajectoryRiskLevel === "inside" || previous?.trajectoryRiskLevel === "near") &&
    current.trajectoryRiskLevel === undefined
  );
}

function hasCleanEscapedTrajectoryRisk(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  return (
    current.status === "flying" &&
    previous?.trajectoryRiskLevel === "inside" &&
    current.trajectoryRiskLevel === undefined &&
    (previous.cargoDamage ?? 0) <= cleanCargoDamageLimit &&
    (current.cargoDamage ?? 0) <= cleanCargoDamageLimit
  );
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

function hasArmedPerfectApproach(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  if (!previous || current.status !== "flying") {
    return false;
  }
  return (
    current.objectivePhase === "delivery" &&
    current.landingStatus === "ready" &&
    (current.cargoDamage ?? 0) <= cleanCargoDamageLimit &&
    (previous.approachStreakSeconds ?? 0) < PERFECT_APPROACH_STREAK_SECONDS &&
    (current.approachStreakSeconds ?? 0) >= PERFECT_APPROACH_STREAK_SECONDS
  );
}

function hasArmedLastDrop(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  return previous !== undefined && !isLastDropWindowOpen(previous) && isLastDropWindowOpen(current);
}

function hasArmedAntimatterDrift(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  return previous !== undefined && !isAntimatterDriftWindowOpen(previous) && isAntimatterDriftWindowOpen(current);
}

function isAntimatterDriftWindowOpen(snapshot: HudAudioSnapshot): boolean {
  return (
    snapshot.status === "flying" &&
    snapshot.contractId === "antimatter-drift" &&
    snapshot.objectivePhase === "delivery" &&
    snapshot.landingStatus === "ready" &&
    snapshot.manualBrakeUsed === false &&
    (snapshot.cargoDamage ?? 0) <= cleanCargoDamageLimit
  );
}

function isLastDropWindowOpen(snapshot: HudAudioSnapshot): boolean {
  return (
    snapshot.status === "flying" &&
    snapshot.objectivePhase === "delivery" &&
    snapshot.landingStatus === "ready" &&
    (snapshot.cargoDamage ?? 0) <= cleanCargoDamageLimit &&
    snapshot.maxFuel > 0 &&
    snapshot.fuel / snapshot.maxFuel <= LAST_DROP_FUEL_RATIO
  );
}

function hasEnteredTightCometReserve(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  if (!previous || current.status !== "flying" || current.paceTier !== "gold" || current.maxFuel <= 0 || previous.maxFuel <= 0) {
    return false;
  }
  if ((current.cargoDamage ?? 0) > cleanCargoDamageLimit) {
    return false;
  }

  const previousReserve = previous.fuel / previous.maxFuel;
  const currentReserve = current.fuel / current.maxFuel;
  return (
    previousReserve >= COMET_RESERVE_WARNING_RATIO &&
    currentReserve >= COMET_RESERVE_MIN_RATIO &&
    currentReserve < COMET_RESERVE_WARNING_RATIO
  );
}

function hasLostCometReserve(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  if (!previous || current.status !== "flying" || current.paceTier !== "gold" || current.maxFuel <= 0 || previous.maxFuel <= 0) {
    return false;
  }
  if ((current.cargoDamage ?? 0) > cleanCargoDamageLimit) {
    return false;
  }

  const previousReserve = previous.fuel / previous.maxFuel;
  const currentReserve = current.fuel / current.maxFuel;
  return previousReserve >= COMET_RESERVE_MIN_RATIO && currentReserve < COMET_RESERVE_MIN_RATIO;
}

function hasDroppedMedalWindow(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  if (!previous?.paceTier || !current.paceTier) {
    return false;
  }
  return paceTierRank(current.paceTier) > paceTierRank(previous.paceTier);
}

function hasEnteredExpressCloseWindow(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  if (!previous) {
    return false;
  }

  return (
    current.status === "flying" &&
    current.objectivePhase === "delivery" &&
    current.paceTier === "gold" &&
    (current.cargoDamage ?? 0) <= cleanCargoDamageLimit &&
    (previous.paceSecondsRemaining ?? 0) > expressCloseSeconds &&
    (current.paceSecondsRemaining ?? 0) > 0 &&
    (current.paceSecondsRemaining ?? 0) <= expressCloseSeconds
  );
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

function hasStyleChainBeenSaved(previous: HudAudioSnapshot | undefined, current: HudAudioSnapshot): boolean {
  const previousChainActive = (previous?.styleMultiplier ?? 1) > 1 && (previous?.styleChainSecondsRemaining ?? 0) > 0;
  const currentChainActive = (current.styleMultiplier ?? 1) > 1 && (current.styleChainSecondsRemaining ?? 0) > 0;
  return (
    previousChainActive &&
    currentChainActive &&
    (previous?.styleChainSecondsRemaining ?? 0) <= criticalStyleChainSeconds &&
    (current.styleChainSecondsRemaining ?? 0) > criticalStyleChainSeconds
  );
}

function paceTierRank(tier: ContractPaceTier): number {
  if (tier === "gold") return 0;
  if (tier === "silver") return 1;
  if (tier === "bronze") return 2;
  return 3;
}
