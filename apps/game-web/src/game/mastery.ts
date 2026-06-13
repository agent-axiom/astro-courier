import { HAZARD_SKIM_BASE_BONUS, HAZARD_THREAD_SPEED_THRESHOLD, PERFECT_APPROACH_STYLE_BONUS } from "@astro-courier/simulation";

export type PreflightMasteryTargetInput = {
  goldSeconds: number;
};

export type PreflightMasteryTarget = {
  label: "Gold" | "Comet";
  value: string;
};

export type PreflightBonusObjectiveInput = {
  contractId?: string;
  quickPickupBonus: number;
  hazardSeverityMultiplier?: number;
};

export type PreflightBonusObjective = {
  label: "Rush pickup" | "Clean skim" | "Perfect dock" | "Needle thread" | "Danger pay" | "Chain finish";
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
  const rushPickup = {
    label: "Rush pickup",
    value: `+${input.quickPickupBonus}`
  } satisfies PreflightBonusObjective;

  if ((input.hazardSeverityMultiplier ?? 1) >= 1.25) {
    return [
      rushPickup,
      {
        label: "Needle thread",
        value: `${HAZARD_THREAD_SPEED_THRESHOLD}+ speed`
      },
      {
        label: "Danger pay",
        value: `+${Math.round(((input.hazardSeverityMultiplier ?? 1) - 1) * 400)}`
      }
    ];
  }

  if (input.contractId === "gravity-slingshot") {
    return [
      rushPickup,
      {
        label: "Chain finish",
        value: "hold combo"
      },
      {
        label: "Perfect dock",
        value: `+${PERFECT_APPROACH_STYLE_BONUS}`
      }
    ];
  }

  return [
    rushPickup,
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
