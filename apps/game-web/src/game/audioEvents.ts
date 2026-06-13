import type { RunStatus } from "@astro-courier/shared";

export type GameAudioEvent =
  | "delivery-complete"
  | "ship-crash"
  | "style-hit"
  | "launch-burst"
  | "assist-burn"
  | "boost-burn"
  | "fuel-critical"
  | "hazard-contact"
  | "trajectory-warning";

export type HudAudioSnapshot = {
  status: RunStatus;
  lastMilestone?: string;
  fuel: number;
  maxFuel: number;
  hazardDangerLevel?: "near" | "inside";
  trajectoryRiskLevel?: "near" | "inside";
};

const criticalFuelRatio = 0.15;
const styleMilestones = new Set([
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

  if (!isFuelCritical(previous) && isFuelCritical(current)) {
    events.push("fuel-critical");
  }

  if (previous?.hazardDangerLevel !== "inside" && current.hazardDangerLevel === "inside") {
    events.push("hazard-contact");
  }

  if (previous?.trajectoryRiskLevel !== current.trajectoryRiskLevel && current.trajectoryRiskLevel === "inside") {
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
