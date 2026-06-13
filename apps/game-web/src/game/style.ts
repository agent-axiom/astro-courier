export type LiveStyleRewardInput = {
  styleBonus: number;
  lastMilestone?: string;
};

export type LiveStyleReward = {
  label: "Style bank" | "Style chain";
  value: string;
  fresh: boolean;
};

const styleMilestones = new Set(["Clean Hazard Skim", "Quick Pickup", "Perfect Approach"]);

export function buildLiveStyleReward(input: LiveStyleRewardInput): LiveStyleReward | undefined {
  const roundedBonus = Math.round(input.styleBonus);
  if (roundedBonus <= 0) {
    return undefined;
  }

  const fresh = input.lastMilestone ? styleMilestones.has(input.lastMilestone) : false;
  return {
    label: fresh ? "Style chain" : "Style bank",
    value: `+${roundedBonus}`,
    fresh
  };
}
