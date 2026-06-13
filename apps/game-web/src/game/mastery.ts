import {
  CHAIN_RELAY_STYLE_CHAIN_WINDOW_SECONDS,
  COMET_FINISH_STYLE_BONUS,
  GRAVITY_SLING_SPEED_THRESHOLD,
  GRAVITY_SLING_STYLE_BONUS,
  EXPRESS_FINISH_STYLE_BONUS,
  HAZARD_SKIM_BASE_BONUS,
  HAZARD_THREAD_SPEED_THRESHOLD,
  LAUNCH_BURST_STYLE_BONUS,
  LAST_DROP_FUEL_RATIO,
  LAST_DROP_STYLE_BONUS,
  NO_BRAKE_STYLE_BONUS,
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
    | "Launch burst"
    | "Express finish"
    | "Comet finish"
    | "Clean skim"
    | "Perfect dock"
    | "Needle thread"
    | "Danger pay"
    | "No brake"
    | "Last Drop"
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
  const cometFinish = {
    label: "Comet finish",
    value: `+${COMET_FINISH_STYLE_BONUS} / perfect comet`
  } satisfies PreflightBonusObjective;
  const launchBurst = {
    label: "Launch burst",
    value: `+${LAUNCH_BURST_STYLE_BONUS} / boost after pickup`
  } satisfies PreflightBonusObjective;
  const lastDrop = {
    label: "Last Drop",
    value: `+${LAST_DROP_STYLE_BONUS} / <=${Math.round(LAST_DROP_FUEL_RATIO * 100)}% fuel`
  } satisfies PreflightBonusObjective;
  const noBrake = {
    label: "No brake",
    value: `+${NO_BRAKE_STYLE_BONUS} / no manual brake`
  } satisfies PreflightBonusObjective;

  if (input.contractId === "chain-relay") {
    return [
      rushPickup,
      launchBurst,
      expressFinish,
      cometFinish,
      {
        label: "Chain finish",
        value: `${CHAIN_RELAY_STYLE_CHAIN_WINDOW_SECONDS.toFixed(1)}s chain window`
      },
      {
        label: "Needle thread",
        value: `${HAZARD_THREAD_SPEED_THRESHOLD}+ speed`
      },
      noBrake,
      lastDrop
    ];
  }

  if ((input.hazardSeverityMultiplier ?? 1) >= 1.25) {
    return [
      rushPickup,
      launchBurst,
      expressFinish,
      cometFinish,
      {
        label: "Needle thread",
        value: `${HAZARD_THREAD_SPEED_THRESHOLD}+ speed`
      },
      {
        label: "Danger pay",
        value: `+${Math.round(((input.hazardSeverityMultiplier ?? 1) - 1) * 400)}`
      },
      noBrake,
      lastDrop
    ];
  }

  if (input.contractId === "gravity-slingshot") {
    return [
      rushPickup,
      launchBurst,
      expressFinish,
      cometFinish,
      {
        label: "Gravity sling",
        value: `+${GRAVITY_SLING_STYLE_BONUS} / ${GRAVITY_SLING_SPEED_THRESHOLD}+ speed`
      },
      {
        label: "Perfect dock",
        value: `+${PERFECT_APPROACH_STYLE_BONUS}`
      },
      noBrake,
      lastDrop
    ];
  }

  if (input.contractId === "return-leg") {
    return [
      rushPickup,
      launchBurst,
      expressFinish,
      cometFinish,
      {
        label: "Chain finish",
        value: "carry chain home"
      },
      {
        label: "Perfect dock",
        value: `+${PERFECT_APPROACH_STYLE_BONUS}`
      },
      noBrake,
      lastDrop
    ];
  }

  return [
    rushPickup,
    launchBurst,
    expressFinish,
    cometFinish,
    {
      label: "Clean skim",
      value: `from +${HAZARD_SKIM_BASE_BONUS}`
    },
    {
      label: "Perfect dock",
      value: `+${PERFECT_APPROACH_STYLE_BONUS}`
    },
    noBrake,
    lastDrop
  ];
}
