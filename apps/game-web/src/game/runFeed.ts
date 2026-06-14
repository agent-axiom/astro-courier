import {
  ANTIMATTER_DRIFT_STYLE_BONUS,
  HAZARD_THREAD_SPEED_THRESHOLD,
  LAST_DROP_FUEL_RATIO,
  LAST_DROP_STYLE_BONUS,
  NO_BRAKE_STYLE_BONUS,
  PERFECT_APPROACH_STREAK_SECONDS,
  PERFECT_APPROACH_STYLE_BONUS
} from "@astro-courier/simulation";
import type { LandingGuidanceStatus, ObjectivePhase, RunMedal, RunStatus } from "@astro-courier/shared";
import {
  COMET_RESERVE_MIN_RATIO,
  COMET_RESERVE_WARNING_RATIO,
  formatCometReserveShortfallFuelGoal,
  isLiveCometDockArmed
} from "./comet";
import type { ContractPaceTier } from "./pace";

export type RunFeedTone = "neutral" | "style" | "success" | "warning" | "danger";

export type RunFeedSnapshot = {
  status: RunStatus;
  contractId?: string;
  objectivePhase?: ObjectivePhase;
  medal?: RunMedal;
  lastMilestone?: string;
  lastStyleAward?: number;
  score?: number;
  speed?: number;
  targetDistance?: number;
  bestRunScore?: number;
  bestRunHasGhostTrail?: boolean;
  paceTier?: ContractPaceTier;
  fuel: number;
  maxFuel: number;
  cargoKind?: string;
  cargoDamage?: number;
  hazardDangerLevel?: "near" | "inside";
  trajectoryRiskLevel?: "near" | "inside";
  trajectoryRiskSeconds?: number;
  launchBurstSecondsRemaining?: number;
  manualBrakeUsed?: boolean;
  landingStatus?: LandingGuidanceStatus;
  perfectDockReady?: boolean;
  approachStreakSeconds?: number;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
};

export type RunFeedUpdate = {
  label: string;
  value: string;
  tone: RunFeedTone;
};

export type RunFeedEntry = RunFeedUpdate & {
  id: number;
};

export type AppendRunFeedResult = {
  entries: RunFeedEntry[];
  nextId: number;
};

const criticalFuelRatio = 0.15;
const criticalStyleChainSeconds = 1;
const bestRunPressureGap = 200;
const cleanCargoDamageLimit = 0.02;
const closeTargetDistance = 90;
const feedMilestones = new Set([
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
  "Antimatter Drift",
  "Assist Burn",
  "Boost Burn"
]);

export function deriveRunFeedUpdates(previous: RunFeedSnapshot | undefined, current: RunFeedSnapshot): RunFeedUpdate[] {
  if (!previous) {
    return [];
  }

  const updates: RunFeedUpdate[] = [];

  if (previous.status !== current.status) {
    if (current.status === "delivered") {
      updates.push(buildDeliveryUpdate(current.medal));
    } else if (current.status === "crashed") {
      updates.push({
        label: "Insurance event",
        value: "Review approach",
        tone: "danger"
      });
    }
  }

  const freshMilestone = current.lastMilestone;
  const freshFeedMilestone =
    freshMilestone !== undefined && freshMilestone !== previous.lastMilestone && feedMilestones.has(freshMilestone);
  if (freshFeedMilestone) {
    updates.push({
      label: freshMilestone,
      value: formatMilestoneValue(current.lastStyleAward),
      tone: "style"
    });
  }

  if (previous.objectivePhase === "pickup" && current.objectivePhase === "delivery") {
    updates.push({
      label: "Cargo loaded",
      value: "Dock outbound",
      tone: "success"
    });
  }

  const targetLineup = buildTargetLineupUpdate(previous, current);
  if (targetLineup) {
    updates.push(targetLineup);
  }

  if (!isFuelCritical(previous) && isFuelCritical(current)) {
    updates.push({
      label: "Fuel critical",
      value: "Coast and commit",
      tone: "warning"
    });
  }

  if (hasCargoDamageCrossedCleanLimit(previous, current)) {
    updates.push({
      label: "Cargo exposed",
      value: "Protect the load",
      tone: "warning"
    });
  }

  if (hasCargoStressStarted(previous, current)) {
    updates.push({
      label: current.cargoKind === "volatile" ? "Brake shock" : "Cargo stress",
      value: current.cargoKind === "volatile" ? "Volatile load" : "Smooth inputs",
      tone: "warning"
    });
  }

  if (hasSpentNoBrakeFinesse(previous, current)) {
    updates.push({
      label: "Finesse spent",
      value: "Manual brake used",
      tone: "warning"
    });
  }

  const medalDrop = buildMedalDropUpdate(previous.paceTier, current.paceTier);
  if (medalDrop) {
    updates.push(medalDrop);
  }

  if (hasEnteredTightCometReserve(previous, current)) {
    updates.push({
      label: "Comet reserve",
      value: `${formatCometReserveBuffer(current)} burn buffer`,
      tone: "warning"
    });
  }

  if (hasLostCometReserve(previous, current)) {
    updates.push({
      label: "Comet reserve lost",
      value: `${formatCometReserveShortfall(current)} short`,
      tone: "danger"
    });
  }

  if (previous.hazardDangerLevel !== "inside" && current.hazardDangerLevel === "inside") {
    updates.push({
      label: "Hazard contact",
      value: "Break field",
      tone: "danger"
    });
  }

  const launchBurstArmed = (previous.launchBurstSecondsRemaining ?? 0) <= 0 && (current.launchBurstSecondsRemaining ?? 0) > 0;
  if (launchBurstArmed) {
    updates.push({
      label: "Burst armed",
      value: `Boost in ${formatSeconds(current.launchBurstSecondsRemaining)}${formatChainSuffix(current)}`,
      tone: "style"
    });
  }

  const lastDropArmed = hasArmedLastDrop(previous, current);
  if (lastDropArmed) {
    updates.push(buildLastDropArmedUpdate(current));
  }

  const antimatterDriftArmed = hasArmedAntimatterDrift(previous, current);
  if (antimatterDriftArmed) {
    updates.push(buildAntimatterDriftArmedUpdate(current));
  }

  if (!freshFeedMilestone && !launchBurstArmed && !lastDropArmed && !antimatterDriftArmed && hasStyleChainBecomeLive(previous, current)) {
    updates.push({
      label: "Chain live",
      value: `x${(current.styleMultiplier ?? 1).toFixed(2)} / ${formatSeconds(current.styleChainSecondsRemaining)}`,
      tone: "style"
    });
  }

  if (!freshFeedMilestone && !launchBurstArmed && hasStyleChainBeenSaved(previous, current)) {
    updates.push({
      label: "Chain saved",
      value: `x${(current.styleMultiplier ?? 1).toFixed(2)} / ${formatSeconds(current.styleChainSecondsRemaining)}`,
      tone: "style"
    });
  }

  if (hasStyleChainReachedCriticalWindow(previous, current)) {
    updates.push(buildCriticalStyleChainUpdate(current));
  }

  if (hasCrossedBestRunScore(previous, current)) {
    const scoreLead = Math.round((current.score ?? 0) - (current.bestRunScore ?? 0));
    updates.push({
      label: current.bestRunHasGhostTrail ? "Ghost pass" : "PB lead",
      value: current.bestRunHasGhostTrail ? `+${scoreLead} over ghost` : `+${scoreLead} score`,
      tone: "success"
    });
  }

  if (hasEnteredBestRunPressure(previous, current)) {
    const scoreGap = Math.round((current.bestRunScore ?? 0) - (current.score ?? 0));
    updates.push({
      label: current.bestRunHasGhostTrail ? "Ghost pressure" : "PB pressure",
      value: current.bestRunHasGhostTrail ? `${scoreGap} behind ghost` : `${scoreGap} score back`,
      tone: "style"
    });
  }

  if (hasArmedCometDock(previous, current)) {
    updates.push({
      label: "Comet armed",
      value: "Perfect dock lined",
      tone: "style"
    });
  } else if (hasArmedPerfectApproach(previous, current)) {
    updates.push({
      label: "Perfect setup",
      value: `Soft dock +${PERFECT_APPROACH_STYLE_BONUS}`,
      tone: "style"
    });
  }

  if (previous.trajectoryRiskLevel !== current.trajectoryRiskLevel && current.trajectoryRiskLevel === "inside") {
    updates.push({
      label: "Collision forecast",
      value: `Evade in ${formatSeconds(current.trajectoryRiskSeconds)}`,
      tone: "danger"
    });
  } else if (previous.trajectoryRiskLevel !== current.trajectoryRiskLevel && current.trajectoryRiskLevel === "near") {
    const damagedCargo = (current.cargoDamage ?? 0) > cleanCargoDamageLimit;
    if (!damagedCargo && (current.speed ?? 0) >= HAZARD_THREAD_SPEED_THRESHOLD) {
      updates.push({
        label: "Thread window",
        value: `Needle gap in ${formatSeconds(current.trajectoryRiskSeconds)}`,
        tone: "style"
      });
    } else {
      updates.push({
        label: damagedCargo ? "Damaged vector" : "Hazard vector",
        value: `${damagedCargo ? "Clear" : "Thread"} in ${formatSeconds(current.trajectoryRiskSeconds)}`,
        tone: "warning"
      });
    }
  } else if (hasClearedTrajectoryRisk(previous, current)) {
    updates.push({
      label: "Vector clear",
      value: "Line recovered",
      tone: "success"
    });
  }

  return updates;
}

function buildDeliveryUpdate(medal: RunMedal | undefined): RunFeedUpdate {
  if (medal === "comet") {
    return {
      label: "Comet secured",
      value: "Route mastered",
      tone: "success"
    };
  }

  if (medal === "gold") {
    return {
      label: "Gold logged",
      value: "Medal pace locked",
      tone: "success"
    };
  }

  return {
    label: "Delivery logged",
    value: "Route complete",
    tone: "success"
  };
}

export function appendRunFeedUpdates(
  currentEntries: readonly RunFeedEntry[],
  updates: readonly RunFeedUpdate[],
  nextId: number,
  maxEntries: number
): AppendRunFeedResult {
  const nextEntries: RunFeedEntry[] = [];
  let nextEntryId = nextId;

  for (const update of updates) {
    nextEntries.unshift({
      id: nextEntryId,
      ...update
    });
    nextEntryId += 1;
  }

  return {
    entries: [...nextEntries, ...currentEntries].slice(0, maxEntries),
    nextId: nextEntryId
  };
}

function formatMilestoneValue(styleAward: number | undefined): string {
  if (styleAward !== undefined && styleAward > 0) {
    return `+${Math.round(styleAward)} style`;
  }

  return "Logged";
}

function isFuelCritical(snapshot: RunFeedSnapshot): boolean {
  return snapshot.maxFuel > 0 && snapshot.fuel / snapshot.maxFuel <= criticalFuelRatio;
}

function hasCargoDamageCrossedCleanLimit(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  return (previous.cargoDamage ?? 0) <= cleanCargoDamageLimit && (current.cargoDamage ?? 0) > cleanCargoDamageLimit;
}

function hasCargoStressStarted(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  const previousDamage = previous.cargoDamage ?? 0;
  const currentDamage = current.cargoDamage ?? 0;
  return previousDamage <= 0 && currentDamage > 0 && currentDamage <= cleanCargoDamageLimit;
}

function buildTargetLineupUpdate(previous: RunFeedSnapshot, current: RunFeedSnapshot): RunFeedUpdate | undefined {
  if (current.status !== "flying" || current.targetDistance === undefined || current.objectivePhase === undefined) {
    return undefined;
  }
  if (previous.objectivePhase !== current.objectivePhase) {
    return undefined;
  }

  const previousDistance = previous.targetDistance ?? Number.POSITIVE_INFINITY;
  if (previousDistance <= closeTargetDistance || current.targetDistance > closeTargetDistance) {
    return undefined;
  }

  const distance = Math.round(current.targetDistance);
  if (current.objectivePhase === "pickup") {
    return { label: "Pickup lined", value: `Pad ${distance}m`, tone: "success" };
  }

  return { label: "Dock lined", value: `Dock ${distance}m`, tone: "success" };
}

function hasSpentNoBrakeFinesse(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  return (
    current.objectivePhase === "delivery" &&
    (current.cargoDamage ?? 0) <= cleanCargoDamageLimit &&
    previous.manualBrakeUsed === false &&
    current.manualBrakeUsed === true
  );
}

function hasClearedTrajectoryRisk(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  return (
    (previous.trajectoryRiskLevel === "inside" || previous.trajectoryRiskLevel === "near") &&
    current.trajectoryRiskLevel === undefined
  );
}

function formatSeconds(seconds: number | undefined): string {
  return `${(seconds ?? 0).toFixed(1)}s`;
}

function formatChainSuffix(snapshot: RunFeedSnapshot): string {
  return (snapshot.styleMultiplier ?? 1) > 1 && (snapshot.styleChainSecondsRemaining ?? 0) > 0
    ? ` / chain x${(snapshot.styleMultiplier ?? 1).toFixed(2)}`
    : "";
}

function hasCrossedBestRunScore(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  if (current.bestRunScore === undefined || previous.bestRunScore !== current.bestRunScore) {
    return false;
  }
  return (previous.score ?? 0) <= current.bestRunScore && (current.score ?? 0) > current.bestRunScore;
}

function hasEnteredBestRunPressure(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  if (current.bestRunScore === undefined || previous.bestRunScore !== current.bestRunScore) {
    return false;
  }

  const previousGap = current.bestRunScore - (previous.score ?? 0);
  const currentGap = current.bestRunScore - (current.score ?? 0);
  return previousGap > bestRunPressureGap && currentGap > 0 && currentGap <= bestRunPressureGap;
}

function hasArmedCometDock(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  if (previous.perfectDockReady || !current.perfectDockReady) {
    return false;
  }
  return isLiveCometDockArmed(current);
}

function hasEnteredTightCometReserve(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  if (current.status !== "flying" || current.paceTier !== "gold" || current.maxFuel <= 0 || previous.maxFuel <= 0) {
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

function hasLostCometReserve(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  if (current.status !== "flying" || current.paceTier !== "gold" || current.maxFuel <= 0 || previous.maxFuel <= 0) {
    return false;
  }
  if ((current.cargoDamage ?? 0) > cleanCargoDamageLimit) {
    return false;
  }

  const previousReserve = previous.fuel / previous.maxFuel;
  const currentReserve = current.fuel / current.maxFuel;
  return previousReserve >= COMET_RESERVE_MIN_RATIO && currentReserve < COMET_RESERVE_MIN_RATIO;
}

function formatCometReserveBuffer(snapshot: RunFeedSnapshot): string {
  const reserve = snapshot.maxFuel > 0 ? snapshot.fuel / snapshot.maxFuel : 0;
  const bufferPercent = Math.max(0, Math.round((reserve - COMET_RESERVE_MIN_RATIO) * 100));
  return `${bufferPercent}%`;
}

function formatCometReserveShortfall(snapshot: RunFeedSnapshot): string {
  const reserve = snapshot.maxFuel > 0 ? snapshot.fuel / snapshot.maxFuel : 0;
  return formatCometReserveShortfallFuelGoal(reserve);
}

function hasArmedPerfectApproach(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  return (
    current.objectivePhase === "delivery" &&
    current.landingStatus === "ready" &&
    (current.cargoDamage ?? 0) <= cleanCargoDamageLimit &&
    (previous.approachStreakSeconds ?? 0) < PERFECT_APPROACH_STREAK_SECONDS &&
    (current.approachStreakSeconds ?? 0) >= PERFECT_APPROACH_STREAK_SECONDS
  );
}

function hasStyleChainReachedCriticalWindow(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  const currentChainActive = (current.styleMultiplier ?? 1) > 1 && (current.styleChainSecondsRemaining ?? 0) > 0;
  if (!currentChainActive) {
    return false;
  }
  return (
    (previous.styleChainSecondsRemaining ?? 0) > criticalStyleChainSeconds &&
    (current.styleChainSecondsRemaining ?? 0) <= criticalStyleChainSeconds
  );
}

function buildCriticalStyleChainUpdate(current: RunFeedSnapshot): RunFeedUpdate {
  if (
    current.objectivePhase === "delivery" &&
    current.landingStatus === "ready" &&
    current.manualBrakeUsed === false &&
    (current.cargoDamage ?? 0) <= cleanCargoDamageLimit
  ) {
    return {
      label: "Finesse dock",
      value: `+${NO_BRAKE_STYLE_BONUS} / chain x${(current.styleMultiplier ?? 1).toFixed(2)} / ${formatSeconds(current.styleChainSecondsRemaining)}`,
      tone: "style"
    };
  }

  return {
    label: "Chain fading",
    value: `Save in ${formatSeconds(current.styleChainSecondsRemaining)}`,
    tone: "warning"
  };
}

function hasArmedLastDrop(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  return !isLastDropWindowOpen(previous) && isLastDropWindowOpen(current);
}

function hasArmedAntimatterDrift(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  return !isAntimatterDriftWindowOpen(previous) && isAntimatterDriftWindowOpen(current);
}

function isAntimatterDriftWindowOpen(snapshot: RunFeedSnapshot): boolean {
  return (
    snapshot.status === "flying" &&
    snapshot.contractId === "antimatter-drift" &&
    snapshot.objectivePhase === "delivery" &&
    snapshot.landingStatus === "ready" &&
    snapshot.manualBrakeUsed === false &&
    (snapshot.cargoDamage ?? 0) <= cleanCargoDamageLimit
  );
}

function isLastDropWindowOpen(snapshot: RunFeedSnapshot): boolean {
  return (
    snapshot.status === "flying" &&
    snapshot.objectivePhase === "delivery" &&
    snapshot.landingStatus === "ready" &&
    (snapshot.cargoDamage ?? 0) <= cleanCargoDamageLimit &&
    snapshot.maxFuel > 0 &&
    snapshot.fuel / snapshot.maxFuel <= LAST_DROP_FUEL_RATIO
  );
}

function buildAntimatterDriftArmedUpdate(current: RunFeedSnapshot): RunFeedUpdate {
  const multiplier = Math.max(1, current.styleMultiplier ?? 1);
  const payout = Math.round(ANTIMATTER_DRIFT_STYLE_BONUS * multiplier);
  const chainActive = multiplier > 1 && (current.styleChainSecondsRemaining ?? 0) > 0;
  return {
    label: "Drift armed",
    value: chainActive ? `+${payout} / chain x${multiplier.toFixed(2)}` : `+${payout} / no brake dock`,
    tone: "style"
  };
}

function buildLastDropArmedUpdate(current: RunFeedSnapshot): RunFeedUpdate {
  const multiplier = Math.max(1, current.styleMultiplier ?? 1);
  const payout = Math.round(LAST_DROP_STYLE_BONUS * multiplier);
  const chainActive = multiplier > 1 && (current.styleChainSecondsRemaining ?? 0) > 0;
  return {
    label: "Last drop armed",
    value: chainActive ? `+${payout} / chain x${multiplier.toFixed(2)}` : `+${payout} / dock empty`,
    tone: "style"
  };
}

function hasStyleChainBecomeLive(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  const previousChainActive = (previous.styleMultiplier ?? 1) > 1 && (previous.styleChainSecondsRemaining ?? 0) > 0;
  const currentChainActive = (current.styleMultiplier ?? 1) > 1 && (current.styleChainSecondsRemaining ?? 0) > 0;
  return !previousChainActive && currentChainActive;
}

function hasStyleChainBeenSaved(previous: RunFeedSnapshot, current: RunFeedSnapshot): boolean {
  const previousChainActive = (previous.styleMultiplier ?? 1) > 1 && (previous.styleChainSecondsRemaining ?? 0) > 0;
  const currentChainActive = (current.styleMultiplier ?? 1) > 1 && (current.styleChainSecondsRemaining ?? 0) > 0;
  return (
    previousChainActive &&
    currentChainActive &&
    (previous.styleChainSecondsRemaining ?? 0) <= criticalStyleChainSeconds &&
    (current.styleChainSecondsRemaining ?? 0) > criticalStyleChainSeconds
  );
}

function buildMedalDropUpdate(previous: ContractPaceTier | undefined, current: ContractPaceTier | undefined): RunFeedUpdate | undefined {
  if (!previous || !current || paceTierRank(current) <= paceTierRank(previous)) {
    return undefined;
  }
  return {
    label: `${capitalize(previous)} missed`,
    value: current === "overtime" ? "No medal window" : `${capitalize(current)} window live`,
    tone: current === "overtime" ? "danger" : "warning"
  };
}

function paceTierRank(tier: ContractPaceTier): number {
  if (tier === "gold") return 0;
  if (tier === "silver") return 1;
  if (tier === "bronze") return 2;
  return 3;
}

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
