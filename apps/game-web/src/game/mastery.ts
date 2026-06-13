import { HAZARD_SKIM_BASE_BONUS, PERFECT_APPROACH_STYLE_BONUS } from "@astro-courier/simulation";

export type PreflightMasteryTargetInput = {
  goldSeconds: number;
};

export type PreflightMasteryTarget = {
  label: "Gold" | "Comet";
  value: string;
};

export type PreflightBonusObjectiveInput = {
  quickPickupBonus: number;
};

export type PreflightBonusObjective = {
  label: "Rush pickup" | "Clean skim" | "Perfect dock";
  value: string;
};

export function buildPreflightMasteryTargets(input: PreflightMasteryTargetInput): PreflightMasteryTarget[] {
  return [
    {
      label: "Gold",
      value: `${Math.round(input.goldSeconds)}s`
    },
    {
      label: "Comet",
      value: "Perfect + reserve"
    }
  ];
}

export function buildPreflightBonusObjectives(input: PreflightBonusObjectiveInput): PreflightBonusObjective[] {
  return [
    {
      label: "Rush pickup",
      value: `+${input.quickPickupBonus}`
    },
    {
      label: "Clean skim",
      value: `from +${HAZARD_SKIM_BASE_BONUS}`
    },
    {
      label: "Perfect dock",
      value: `+${PERFECT_APPROACH_STYLE_BONUS}`
    }
  ];
}
