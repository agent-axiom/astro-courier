import type { CrashReason, RunMedal, RunStatus, ScoreBreakdown } from "@astro-courier/shared";
import type { BestRun } from "./bestRun";
import { COMET_RESERVE_MIN_RATIO, formatCometReserveShortfallFuelGoal } from "./comet";

export type RetryTargetInput = {
  status: RunStatus;
  contractId?: string;
  crashReason?: CrashReason;
  lastMilestone?: string;
  medal: RunMedal;
  elapsedSeconds: number;
  goldSeconds: number;
  targetAllowedSpeed?: number;
  cargoDamage?: number;
  fuel?: number;
  maxFuel?: number;
  landingBonus?: number;
  scoreBreakdown?: ScoreBreakdown;
  score: number;
  isNewBest: boolean;
  bestRun: BestRun | undefined;
};

export type RetryTarget = {
  label: "Retry target";
  value: string;
  tone: "danger" | "chase" | "opportunity" | "success";
};

export type ResultRetryAction = {
  label:
    | "Retry Route"
    | "Fix Dock"
    | "Clear Lane"
    | "Defend PB"
    | "Chase PB"
    | "Race Ghost"
    | "Repeat Line"
    | "Clean Run"
    | "Chase Gold"
    | "Chase Comet"
    | "Chain Run"
    | "Express Run"
    | "Perfect Dock"
    | "Set PB"
    | "Run Again";
  tone: RetryTarget["tone"];
  mode: "restart-run";
};

export type RetryActionBriefing = {
  label: "Next run";
  value: string;
  tone: RetryTarget["tone"];
};

const cleanCargoDamageLimit = 0.02;
const cometReserveNearMissRatio = 0.6;
const dangerPayMinBonus = 300;
const perfectLandingBonus = 300;

export function buildRetryTarget(input: RetryTargetInput): RetryTarget {
  if (input.status === "crashed") {
    if (input.crashReason === "Hard Landing" && input.targetAllowedSpeed !== undefined) {
      return {
        label: "Retry target",
        value: `Dock under ${input.targetAllowedSpeed.toFixed(1)}`,
        tone: "danger"
      };
    }

    if (input.crashReason === "Hull Collision") {
      return {
        label: "Retry target",
        value:
          input.contractId === "gravity-slingshot"
            ? "Hold outer sling lane"
            : input.contractId === "chain-relay"
            ? "Clear relay lane"
            : input.contractId === "asteroid-sprint"
            ? "Clear asteroid field"
            : "Clear gravity well",
        tone: "danger"
      };
    }

    return {
      label: "Retry target",
      value: "Complete delivery",
      tone: "danger"
    };
  }

  if (input.isNewBest && input.bestRun) {
    return {
      label: "Retry target",
      value: `Defend ${input.bestRun.score} / ${input.bestRun.elapsedSeconds.toFixed(1)}s`,
      tone: "success"
    };
  }

  if (input.bestRun) {
    const hasGhostTrail = (input.bestRun.ghostTrail?.length ?? 0) >= 2;
    const scoreGap = input.bestRun.score - input.score;
    if (scoreGap > 0) {
      return {
        label: "Retry target",
        value: hasGhostTrail ? `Catch ghost +${Math.round(scoreGap)} score` : `Find +${Math.round(scoreGap)} score`,
        tone: "chase"
      };
    }

    if (input.elapsedSeconds > input.bestRun.elapsedSeconds + 0.05) {
      return {
        label: "Retry target",
        value: hasGhostTrail ? `Beat ghost ${input.bestRun.elapsedSeconds.toFixed(1)}s` : `Beat ${input.bestRun.elapsedSeconds.toFixed(1)}s`,
        tone: "chase"
      };
    }
  }

  const cometNearMissTarget = buildCometNearMissTarget(input);
  if (cometNearMissTarget) {
    return cometNearMissTarget;
  }

  const milestoneTarget = buildRepeatableMilestoneTarget(input.lastMilestone);
  if (milestoneTarget) {
    return milestoneTarget;
  }

  if (isDangerPayClear(input.scoreBreakdown)) {
    return {
      label: "Retry target",
      value: "Repeat Danger Pay",
      tone: "opportunity"
    };
  }

  if ((input.cargoDamage ?? 0) > cleanCargoDamageLimit) {
    return {
      label: "Retry target",
      value: "Restore clean cargo",
      tone: "opportunity"
    };
  }

  if (input.medal !== "gold" && input.medal !== "comet") {
    return {
      label: "Retry target",
      value: `Gold under ${input.goldSeconds.toFixed(1)}s`,
      tone: "opportunity"
    };
  }

  if (input.lastMilestone !== "Express Finish") {
    return {
      label: "Retry target",
      value: "Chase Express Finish",
      tone: "opportunity"
    };
  }

  if (input.contractId === "return-leg" || input.contractId === "chain-relay") {
    return {
      label: "Retry target",
      value: "Carry Chain Finish",
      tone: "opportunity"
    };
  }

  if ((input.landingBonus ?? 0) < perfectLandingBonus) {
    return {
      label: "Retry target",
      value: "Perfect dock",
      tone: "opportunity"
    };
  }

  return {
    label: "Retry target",
    value: input.bestRun ? "Add one more bonus" : "Set first PB",
    tone: "opportunity"
  };
}

function buildRepeatableMilestoneTarget(lastMilestone?: string): RetryTarget | undefined {
  switch (lastMilestone) {
    case "Comet Finish":
    case "Damage Control":
    case "Eco Drift":
    case "Last Drop":
    case "No Brake Finesse":
    case "Antimatter Drift":
    case "Perfect Approach":
    case "Chain Finish":
    case "Launch Burst":
    case "Assist Burn":
    case "Boost Burn":
    case "Quick Pickup":
    case "Clean Hazard Skim":
    case "Needle Thread":
    case "Gravity Sling":
      return {
        label: "Retry target",
        value: `Repeat ${lastMilestone}`,
        tone: "opportunity"
      };
    default:
      return undefined;
  }
}

export function buildResultRetryAction(target: RetryTarget): ResultRetryAction {
  if (target.tone === "danger") {
    if (target.value.startsWith("Dock under ")) {
      return { label: "Fix Dock", tone: "danger", mode: "restart-run" };
    }
    if (isLaneRepairTarget(target.value)) {
      return { label: "Clear Lane", tone: "danger", mode: "restart-run" };
    }
    return { label: "Retry Route", tone: "danger", mode: "restart-run" };
  }
  if (target.tone === "success") {
    return { label: "Defend PB", tone: "success", mode: "restart-run" };
  }
  if (target.tone === "chase") {
    if (isGhostRetryTarget(target.value)) {
      return { label: "Race Ghost", tone: "chase", mode: "restart-run" };
    }
    return { label: "Chase PB", tone: "chase", mode: "restart-run" };
  }
  if (target.value.startsWith("Repeat ")) {
    return { label: "Repeat Line", tone: "opportunity", mode: "restart-run" };
  }
  if (isCometRetryTarget(target.value)) {
    return { label: "Chase Comet", tone: "opportunity", mode: "restart-run" };
  }
  if (target.value === "Restore clean cargo") {
    return { label: "Clean Run", tone: "opportunity", mode: "restart-run" };
  }
  if (target.value === "Carry Chain Finish") {
    return { label: "Chain Run", tone: "opportunity", mode: "restart-run" };
  }
  if (target.value === "Perfect dock") {
    return { label: "Perfect Dock", tone: "opportunity", mode: "restart-run" };
  }
  if (target.value.startsWith("Gold under ")) {
    return { label: "Chase Gold", tone: "opportunity", mode: "restart-run" };
  }
  if (target.value === "Chase Express Finish") {
    return { label: "Express Run", tone: "opportunity", mode: "restart-run" };
  }
  if (target.value === "Set first PB") {
    return { label: "Set PB", tone: "opportunity", mode: "restart-run" };
  }
  return { label: "Run Again", tone: target.tone, mode: "restart-run" };
}

export function buildRetryActionBriefing(action: ResultRetryAction, target: RetryTarget): RetryActionBriefing {
  if (action.label === "Fix Dock") {
    return {
      label: "Next run",
      value: "Feather final brake",
      tone: "danger"
    };
  }
  if (action.label === "Clear Lane") {
    return {
      label: "Next run",
      value: "Widen the route line",
      tone: "danger"
    };
  }
  if (action.label === "Defend PB") {
    return {
      label: "Next run",
      value: "Protect the new line",
      tone: "success"
    };
  }
  if (action.label === "Chase PB") {
    return {
      label: "Next run",
      value: "Route has score left",
      tone: "chase"
    };
  }
  if (action.label === "Race Ghost") {
    return {
      label: "Next run",
      value: "Hunt the saved line",
      tone: "chase"
    };
  }
  if (action.label === "Repeat Line") {
    if (target.value === "Repeat Danger Pay") {
      return {
        label: "Next run",
        value: "Lock the risk line",
        tone: "opportunity"
      };
    }

    if (target.value === "Repeat Assist Burn" || target.value === "Repeat Boost Burn") {
      return {
        label: "Next run",
        value: "Lock burn control",
        tone: "opportunity"
      };
    }

    if (target.value === "Repeat Antimatter Drift") {
      return {
        label: "Next run",
        value: "Thread the drift dock",
        tone: "opportunity"
      };
    }

    if (target.value === "Repeat Eco Drift") {
      return {
        label: "Next run",
        value: "Hold the low-burn line",
        tone: "opportunity"
      };
    }

    if (target.value === "Repeat Perfect Approach") {
      return {
        label: "Next run",
        value: "Repeat the soft dock",
        tone: "opportunity"
      };
    }

    return {
      label: "Next run",
      value: "Lock the style route",
      tone: "opportunity"
    };
  }
  if (action.label === "Chase Comet") {
    const fuelGoal = extractCometFuelGoal(target.value);
    if (fuelGoal) {
      return {
        label: "Next run",
        value: `Coast ${fuelGoal}`,
        tone: "opportunity"
      };
    }

    if (target.value === "Perfect dock for comet") {
      return {
        label: "Next run",
        value: "Perfect final dock",
        tone: "opportunity"
      };
    }

    return {
      label: "Next run",
      value: "One condition from comet",
      tone: "opportunity"
    };
  }
  if (action.label === "Retry Route") {
    return {
      label: "Next run",
      value: "Fix the failure point",
      tone: "danger"
    };
  }
  if (target.value === "Restore clean cargo") {
    return {
      label: "Next run",
      value: "No-scratch rematch",
      tone: "opportunity"
    };
  }
  if (action.label === "Chain Run") {
    return {
      label: "Next run",
      value: "Carry the chain home",
      tone: "opportunity"
    };
  }
  if (action.label === "Perfect Dock") {
    return {
      label: "Next run",
      value: "Feather the final brake",
      tone: "opportunity"
    };
  }
  if (action.label === "Chase Gold") {
    return {
      label: "Next run",
      value: "Convert medal pace",
      tone: "opportunity"
    };
  }
  if (action.label === "Express Run") {
    return {
      label: "Next run",
      value: "Cut the delivery split",
      tone: "opportunity"
    };
  }
  if (action.label === "Set PB") {
    return {
      label: "Next run",
      value: "Bank the first line",
      tone: "opportunity"
    };
  }
  return {
    label: "Next run",
    value: target.value,
    tone: target.tone
  };
}

function isLaneRepairTarget(value: string): boolean {
  return (
    value === "Clear gravity well" ||
    value === "Hold outer sling lane" ||
    value === "Clear relay lane" ||
    value === "Clear asteroid field"
  );
}

function isDangerPayClear(scoreBreakdown: ScoreBreakdown | undefined): boolean {
  return Boolean(
    scoreBreakdown &&
      scoreBreakdown.dangerBonus > scoreBreakdown.styleBonus &&
      scoreBreakdown.dangerBonus >= dangerPayMinBonus
  );
}

function buildCometNearMissTarget(input: RetryTargetInput): RetryTarget | undefined {
  if (
    input.status !== "delivered" ||
    input.medal !== "gold" ||
    input.lastMilestone !== "Express Finish" ||
    (input.cargoDamage ?? 0) > cleanCargoDamageLimit ||
    input.maxFuel === undefined ||
    input.maxFuel <= 0 ||
    input.fuel === undefined
  ) {
    return undefined;
  }

  const fuelRatio = input.fuel / input.maxFuel;
  if (fuelRatio >= cometReserveNearMissRatio && fuelRatio < COMET_RESERVE_MIN_RATIO) {
    return {
      label: "Retry target",
      value: `Bank ${formatCometReserveShortfallFuelGoal(fuelRatio)} for comet`,
      tone: "opportunity"
    };
  }

  if (fuelRatio >= COMET_RESERVE_MIN_RATIO && (input.landingBonus ?? 0) < perfectLandingBonus) {
    return {
      label: "Retry target",
      value: "Perfect dock for comet",
      tone: "opportunity"
    };
  }

  return undefined;
}

function isCometRetryTarget(value: string): boolean {
  return value === "Perfect dock for comet" || (value.startsWith("Bank +") && value.endsWith("% fuel for comet"));
}

function isGhostRetryTarget(value: string): boolean {
  return value.startsWith("Catch ghost ") || value.startsWith("Beat ghost ");
}

function extractCometFuelGoal(value: string): `+${number}% fuel` | undefined {
  const match = /^Bank (\+\d+% fuel) for comet$/.exec(value);
  return match ? (match[1] as `+${number}% fuel`) : undefined;
}
