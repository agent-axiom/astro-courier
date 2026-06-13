import {
  GRAVITY_SLING_SPEED_THRESHOLD,
  GRAVITY_SLING_STYLE_BONUS,
  EXPRESS_FINISH_STYLE_BONUS,
  HAZARD_SKIM_BASE_BONUS,
  HAZARD_THREAD_SPEED_THRESHOLD,
  PERFECT_APPROACH_STYLE_BONUS
} from "@astro-courier/simulation";

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
  label:
    | "Rush pickup"
    | "Express finish"
    | "Clean skim"
    | "Perfect dock"
    | "Needle thread"
    | "Danger pay"
    | "Chain finish"
    | "Gravity sling";
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
  const expressFinish = {
    label: "Express finish",
    value: `+${EXPRESS_FINISH_STYLE_BONUS} / gold pace`
  } satisfies PreflightBonusObjective;

  if ((input.hazardSeverityMultiplier ?? 1) >= 1.25) {
    return [
      rushPickup,
      expressFinish,
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
      expressFinish,
      {
        label: "Gravity sling",
        value: `+${GRAVITY_SLING_STYLE_BONUS} / ${GRAVITY_SLING_SPEED_THRESHOLD}+ speed`
      },
      {
        label: "Perfect dock",
        value: `+${PERFECT_APPROACH_STYLE_BONUS}`
      }
    ];
  }

  return [
    rushPickup,
    expressFinish,
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
