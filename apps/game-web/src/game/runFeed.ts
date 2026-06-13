import type { RunStatus } from "@astro-courier/shared";

export type RunFeedTone = "neutral" | "style" | "success" | "warning" | "danger";

export type RunFeedSnapshot = {
  status: RunStatus;
  lastMilestone?: string;
  lastStyleAward?: number;
  fuel: number;
  maxFuel: number;
  hazardDangerLevel?: "near" | "inside";
  trajectoryRiskLevel?: "near" | "inside";
  trajectoryRiskSeconds?: number;
  launchBurstSecondsRemaining?: number;
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
      value: `Boost in ${formatSeconds(current.launchBurstSecondsRemaining)}`,
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
