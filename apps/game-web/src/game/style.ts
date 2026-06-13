import { STYLE_CHAIN_WINDOW_SECONDS } from "@astro-courier/simulation";

export type LiveStyleRewardInput = {
  styleBonus: number;
  lastStyleAward?: number;
  lastMilestone?: string;
  styleMultiplier?: number;
  styleChainSecondsRemaining?: number;
};

export type LiveStyleReward = {
  label: "Style bank" | "Style chain" | "Style hit";
  value: string;
  fresh: boolean;
  chainProgress: number;
};

const styleMilestones = new Set(["Clean Hazard Skim", "Quick Pickup", "Perfect Approach", "Eco Drift"]);

export function buildLiveStyleReward(input: LiveStyleRewardInput): LiveStyleReward | undefined {
  const roundedBonus = Math.round(input.styleBonus);
  if (roundedBonus <= 0) {
    return undefined;
  }

  const fresh = input.lastMilestone ? styleMilestones.has(input.lastMilestone) : false;
  const chainActive = (input.styleMultiplier ?? 1) > 1 && (input.styleChainSecondsRemaining ?? 0) > 0;
  const freshAward = fresh && input.lastStyleAward !== undefined && input.lastStyleAward > 0 ? Math.round(input.lastStyleAward) : undefined;
  const chainProgress = chainActive ? round(clamp((input.styleChainSecondsRemaining ?? 0) / STYLE_CHAIN_WINDOW_SECONDS, 0, 1), 2) : 0;
  return {
    label: freshAward ? "Style hit" : fresh || chainActive ? "Style chain" : "Style bank",
    value: freshAward
      ? `+${freshAward} hit / +${roundedBonus} bank / x${(input.styleMultiplier ?? 1).toFixed(2)}`
      : chainActive
      ? `+${roundedBonus} / x${(input.styleMultiplier ?? 1).toFixed(2)} / ${(input.styleChainSecondsRemaining ?? 0).toFixed(1)}s`
      : `+${roundedBonus}`,
    fresh,
    chainProgress
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
