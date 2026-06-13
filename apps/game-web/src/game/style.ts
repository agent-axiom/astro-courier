import {
  CHAIN_RELAY_STYLE_CHAIN_WINDOW_SECONDS,
  LAUNCH_BURST_STYLE_BONUS,
  NO_BRAKE_STYLE_BONUS,
  STYLE_CHAIN_WINDOW_SECONDS
} from "@astro-courier/simulation";
import type { ObjectivePhase, RunStatus } from "@astro-courier/shared";

export const STYLE_CHAIN_URGENT_SECONDS = 1;

export type LiveStyleRewardInput = {
  contractId?: string;
  styleBonus: number;
  lastStyleAward?: number;
  lastMilestone?: string;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
  launchBurstSecondsRemaining?: number;
  quickPickupSecondsRemaining?: number;
  cargoDamage?: number;
  hazardDangerLevel?: "near" | "inside";
  gravitySlingReady?: boolean;
};

export type LiveStyleReward = {
  label: "Style bank" | "Style chain" | "Style hit";
  value: string;
  action?: string;
  fresh: boolean;
  tone: "bank" | "chain" | "fresh" | "urgent";
  chainProgress: number;
};

export type StyleTargetCueInput = {
  status: RunStatus;
  objectivePhase?: ObjectivePhase;
  styleBonus: number;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
  quickPickupSecondsRemaining?: number;
  quickPickupBonus?: number;
  launchBurstSecondsRemaining?: number;
  cargoDamage?: number;
  hazardDangerLevel?: "near" | "inside";
  gravitySlingReady?: boolean;
  gravitySlingStyleBonus?: number;
  manualBrakeUsed?: boolean;
};

export type StyleTargetCue = {
  label: "Style target";
  value: string;
  tone: "chain" | "opportunity" | "risk";
};

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

export function buildLiveStyleReward(input: LiveStyleRewardInput): LiveStyleReward | undefined {
  const roundedBonus = Math.round(input.styleBonus);
  if (roundedBonus <= 0) {
    return undefined;
  }

  const fresh = input.lastMilestone ? styleMilestones.has(input.lastMilestone) : false;
  const styleChainSecondsRemaining = input.styleChainSecondsRemaining ?? 0;
  const chainActive = (input.styleMultiplier ?? 1) > 1 && styleChainSecondsRemaining > 0;
  const urgent = chainActive && styleChainSecondsRemaining <= STYLE_CHAIN_URGENT_SECONDS && !fresh;
  const freshAward = fresh && input.lastStyleAward !== undefined && input.lastStyleAward > 0 ? Math.round(input.lastStyleAward) : undefined;
  const chainProgress = chainActive ? round(clamp(styleChainSecondsRemaining / styleChainWindowSeconds(input), 0, 1), 2) : 0;
  const urgentAction = urgent ? buildUrgentChainAction(input) : "Save chain";
  return {
    label: freshAward ? "Style hit" : fresh || chainActive ? "Style chain" : "Style bank",
    value: freshAward
      ? `+${freshAward} hit / +${roundedBonus} bank / x${(input.styleMultiplier ?? 1).toFixed(2)}`
      : urgent
      ? `${urgentAction} / x${(input.styleMultiplier ?? 1).toFixed(2)} / ${styleChainSecondsRemaining.toFixed(1)}s`
      : chainActive
      ? `+${roundedBonus} / x${(input.styleMultiplier ?? 1).toFixed(2)} / ${styleChainSecondsRemaining.toFixed(1)}s`
      : `+${roundedBonus}`,
    action: urgent ? urgentAction : undefined,
    fresh,
    tone: freshAward ? "fresh" : urgent ? "urgent" : chainActive || fresh ? "chain" : "bank",
    chainProgress
  };
}

export function buildStyleTargetCue(input: StyleTargetCueInput): StyleTargetCue | undefined {
  if (input.status !== "flying") {
    return undefined;
  }

  const chainActive = (input.styleMultiplier ?? 1) > 1 && (input.styleChainSecondsRemaining ?? 0) > 0;
  const chainSuffix = chainActive ? ` / chain x${(input.styleMultiplier ?? 1).toFixed(2)}` : "";

  if (input.gravitySlingReady && (input.gravitySlingStyleBonus ?? 0) > 0) {
    return {
      label: "Style target",
      value: `Sling window / +${Math.round(input.gravitySlingStyleBonus ?? 0)}${chainSuffix}`,
      tone: chainActive ? "chain" : "opportunity"
    };
  }

  if ((input.launchBurstSecondsRemaining ?? 0) > 0) {
    return {
      label: "Style target",
      value: `Boost burst / +${LAUNCH_BURST_STYLE_BONUS} / ${(input.launchBurstSecondsRemaining ?? 0).toFixed(1)}s${chainSuffix}`,
      tone: chainActive ? "chain" : "opportunity"
    };
  }

  if (
    input.objectivePhase === "pickup" &&
    (input.quickPickupSecondsRemaining ?? 0) > 0 &&
    (input.quickPickupBonus ?? 0) > 0
  ) {
    return {
      label: "Style target",
      value: `Pickup rush / +${Math.round(input.quickPickupBonus ?? 0)} / ${(input.quickPickupSecondsRemaining ?? 0).toFixed(1)}s`,
      tone: "opportunity"
    };
  }

  if (input.hazardDangerLevel === "near" && (input.cargoDamage ?? 0) <= 0.02) {
    return {
      label: "Style target",
      value: `Clean skim / danger style${chainSuffix}`,
      tone: chainActive ? "chain" : "risk"
    };
  }

  if (input.objectivePhase === "delivery" && input.manualBrakeUsed === false && (input.cargoDamage ?? 0) <= 0.02) {
    return {
      label: "Style target",
      value: `No brake line / +${NO_BRAKE_STYLE_BONUS} on clean dock`,
      tone: "opportunity"
    };
  }

  return undefined;
}

function buildUrgentChainAction(input: LiveStyleRewardInput): string {
  if (input.gravitySlingReady) {
    return "Sling now";
  }
  if (input.hazardDangerLevel === "near" && (input.cargoDamage ?? 0) <= 0.02) {
    return "Skim now";
  }
  if ((input.launchBurstSecondsRemaining ?? 0) > 0) {
    return "Boost now";
  }
  if ((input.quickPickupSecondsRemaining ?? 0) > 0) {
    return "Pickup now";
  }
  if (input.contractId === "chain-relay") {
    return "Dock chain";
  }
  return "Save chain";
}

function styleChainWindowSeconds(input: LiveStyleRewardInput): number {
  return input.contractId === "chain-relay" ? CHAIN_RELAY_STYLE_CHAIN_WINDOW_SECONDS : STYLE_CHAIN_WINDOW_SECONDS;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
