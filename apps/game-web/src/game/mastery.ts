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
  PERFECT_APPROACH_STYLE_BONUS,
  RISK_GATE_STYLE_BONUS
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

export type PreflightPuzzleGoalInput = {
  contractId?: string;
  targetDistanceLabel: string;
  goldSeconds: number;
  hazardSeverityMultiplier?: number;
  interceptorCount: number;
  riskGateCount: number;
  clearedRiskGateCount: number;
  nextRiskGateDistance?: number;
  nextRiskGateStyleBonus?: number;
};

export type PreflightPuzzleGoal = {
  label: "Route" | "Clock" | "Maze" | "Thread" | "Sling" | "Chain" | "Brake" | "Fuel" | "Gate" | "Fire" | "Comet";
  value: string;
  detail?: string;
  tone: "route" | "pace" | "risk" | "style" | "clutch" | "combat";
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

export function buildPreflightPuzzleGoals(input: PreflightPuzzleGoalInput): PreflightPuzzleGoal[] {
  return [
    {
      label: "Route",
      value: input.targetDistanceLabel,
      tone: "route"
    },
    buildRoutePuzzleGoal(input),
    buildRoutePressureGoal(input)
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
    value: `+${COMET_FINISH_STYLE_BONUS} / 75% fuel + perfect dock`
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

function buildRoutePuzzleGoal(input: PreflightPuzzleGoalInput): PreflightPuzzleGoal {
  if (input.contractId === "asteroid-labyrinth") {
    return {
      label: "Maze",
      value: `${input.riskGateCount} gates`,
      detail: "Thread gaps",
      tone: "risk"
    };
  }

  if (input.contractId === "solar-thread") {
    return {
      label: "Thread",
      value: "Solar gap",
      detail: `${HAZARD_THREAD_SPEED_THRESHOLD}+ speed`,
      tone: "risk"
    };
  }

  if (input.contractId === "asteroid-sprint" || (input.hazardSeverityMultiplier ?? 1) >= 1.25) {
    return {
      label: "Thread",
      value: `${HAZARD_THREAD_SPEED_THRESHOLD}+ speed`,
      detail: "Asteroid line",
      tone: "risk"
    };
  }

  if (input.contractId === "gravity-slingshot") {
    return {
      label: "Sling",
      value: `${GRAVITY_SLING_SPEED_THRESHOLD}+ speed`,
      detail: `+${GRAVITY_SLING_STYLE_BONUS}`,
      tone: "style"
    };
  }

  if (input.contractId === "gravity-lockpick") {
    return {
      label: "Sling",
      value: "Lockpick",
      detail: "One arc",
      tone: "style"
    };
  }

  if (input.contractId === "chain-relay") {
    return {
      label: "Chain",
      value: "Carry home",
      detail: `${CHAIN_RELAY_STYLE_CHAIN_WINDOW_SECONDS.toFixed(1)}s`,
      tone: "style"
    };
  }

  if (input.contractId === "return-leg") {
    return {
      label: "Chain",
      value: "Reverse",
      detail: "Dock chain",
      tone: "style"
    };
  }

  if (input.contractId === "antimatter-drift") {
    return {
      label: "Brake",
      value: "No brake",
      detail: "Clean dock",
      tone: "clutch"
    };
  }

  if (input.contractId === "last-drop-run") {
    return {
      label: "Fuel",
      value: `<=${Math.round(LAST_DROP_FUEL_RATIO * 100)}%`,
      detail: "Soft dock",
      tone: "clutch"
    };
  }

  return {
    label: "Clock",
    value: `${Math.round(input.goldSeconds)}s`,
    detail: "Gold",
    tone: "pace"
  };
}

function buildRoutePressureGoal(input: PreflightPuzzleGoalInput): PreflightPuzzleGoal {
  if (input.riskGateCount > 0) {
    const gateDetail =
      input.nextRiskGateDistance === undefined ? `+${input.nextRiskGateStyleBonus ?? RISK_GATE_STYLE_BONUS}` : `${input.nextRiskGateDistance}m`;
    return {
      label: "Gate",
      value: `${input.clearedRiskGateCount}/${input.riskGateCount}`,
      detail: gateDetail,
      tone: "risk"
    };
  }

  if (input.interceptorCount > 0) {
    return {
      label: "Fire",
      value: `${input.interceptorCount} ${input.interceptorCount === 1 ? "ship" : "ships"}`,
      detail: "+35 tags",
      tone: "combat"
    };
  }

  return {
    label: "Comet",
    value: "Perfect",
    detail: "75% fuel",
    tone: "style"
  };
}
