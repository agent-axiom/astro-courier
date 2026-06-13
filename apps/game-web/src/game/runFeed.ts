import type { RunStatus } from "@astro-courier/shared";
import type { ContractPaceTier } from "./pace";

export type RunFeedTone = "neutral" | "style" | "success" | "warning" | "danger";

export type RunFeedSnapshot = {
  status: RunStatus;
  lastMilestone?: string;
  lastStyleAward?: number;
  score?: number;
  bestRunScore?: number;
  paceTier?: ContractPaceTier;
  fuel: number;
  maxFuel: number;
  hazardDangerLevel?: "near" | "inside";
  trajectoryRiskLevel?: "near" | "inside";
  trajectoryRiskSeconds?: number;
  launchBurstSecondsRemaining?: number;
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
const feedMilestones = new Set([
  "Clean Hazard Skim",
  "Needle Thread",
  "Gravity Sling",
  "Quick Pickup",
  "Launch Burst",
  "Perfect Approach",
  "Eco Drift",
  "Chain Finish",
  "Express Finish",
  "Damage Control",
  "Last Drop",
  "No Brake Finesse",
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
      updates.push({
        label: "Delivery logged",
        value: "Route complete",
        tone: "success"
      });
    } else if (current.status === "crashed") {
      updates.push({
        label: "Insurance event",
        value: "Review approach",
        tone: "danger"
      });
    }
  }

  if (current.lastMilestone && current.lastMilestone !== previous.lastMilestone && feedMilestones.has(current.lastMilestone)) {
    updates.push({
      label: current.lastMilestone,
      value: formatMilestoneValue(current.lastStyleAward),
      tone: "style"
    });
  }

  if (!isFuelCritical(previous) && isFuelCritical(current)) {
    updates.push({
      label: "Fuel critical",
      value: "Coast and commit",
      tone: "warning"
    });
  }

  const medalDrop = buildMedalDropUpdate(previous.paceTier, current.paceTier);
  if (medalDrop) {
    updates.push(medalDrop);
  }

  if (previous.hazardDangerLevel !== "inside" && current.hazardDangerLevel === "inside") {
    updates.push({
      label: "Hazard contact",
      value: "Break field",
      tone: "danger"
    });
  }

  if ((previous.launchBurstSecondsRemaining ?? 0) <= 0 && (current.launchBurstSecondsRemaining ?? 0) > 0) {
    updates.push({
      label: "Burst armed",
      value: `Boost in ${formatSeconds(current.launchBurstSecondsRemaining)}${formatChainSuffix(current)}`,
      tone: "style"
    });
  }

  if (hasStyleChainReachedCriticalWindow(previous, current)) {
    updates.push({
      label: "Chain fading",
      value: `Save in ${formatSeconds(current.styleChainSecondsRemaining)}`,
      tone: "warning"
    });
  }

  if (hasCrossedBestRunScore(previous, current)) {
    updates.push({
      label: "PB lead",
      value: `+${Math.round((current.score ?? 0) - (current.bestRunScore ?? 0))} score`,
      tone: "success"
    });
  }

  if (hasEnteredBestRunPressure(previous, current)) {
    updates.push({
      label: "PB pressure",
      value: `${Math.round((current.bestRunScore ?? 0) - (current.score ?? 0))} score back`,
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
    updates.push({
      label: "Hazard vector",
      value: `Thread in ${formatSeconds(current.trajectoryRiskSeconds)}`,
      tone: "warning"
    });
  }

  return updates;
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
