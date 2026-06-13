import type { CrashReason, RunMedal, RunStatus } from "@astro-courier/shared";
import type { BestRun } from "./bestRun";

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
    | "Defend PB"
    | "Chase PB"
    | "Repeat Line"
    | "Clean Run"
    | "Chase Gold"
    | "Chase Comet"
    | "Express Run"
    | "Set PB"
    | "Run Again";
  mode: "restart-run";
};

export type RetryActionBriefing = {
  label: "Next run";
  value: string;
  tone: RetryTarget["tone"];
};

const cleanCargoDamageLimit = 0.02;
const cometReserveMinRatio = 0.75;
const cometReserveNearMissRatio = 0.6;
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
    const scoreGap = input.bestRun.score - input.score;
    if (scoreGap > 0) {
      return {
        label: "Retry target",
        value: `Find +${Math.round(scoreGap)} score`,
        tone: "chase"
      };
    }

    if (input.elapsedSeconds > input.bestRun.elapsedSeconds + 0.05) {
      return {
        label: "Retry target",
        value: `Beat ${input.bestRun.elapsedSeconds.toFixed(1)}s`,
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
    case "Last Drop":
    case "No Brake Finesse":
    case "Perfect Approach":
    case "Chain Finish":
    case "Launch Burst":
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
    return { label: "Retry Route", mode: "restart-run" };
  }
  if (target.tone === "success") {
    return { label: "Defend PB", mode: "restart-run" };
  }
  if (target.tone === "chase") {
    return { label: "Chase PB", mode: "restart-run" };
  }
  if (target.value.startsWith("Repeat ")) {
    return { label: "Repeat Line", mode: "restart-run" };
  }
  if (target.value === "Bank 75% fuel for comet" || target.value === "Perfect dock for comet") {
    return { label: "Chase Comet", mode: "restart-run" };
  }
  if (target.value === "Restore clean cargo") {
    return { label: "Clean Run", mode: "restart-run" };
  }
  if (target.value.startsWith("Gold under ")) {
    return { label: "Chase Gold", mode: "restart-run" };
  }
  if (target.value === "Chase Express Finish") {
    return { label: "Express Run", mode: "restart-run" };
  }
  if (target.value === "Set first PB") {
    return { label: "Set PB", mode: "restart-run" };
  }
  return { label: "Run Again", mode: "restart-run" };
}

export function buildRetryActionBriefing(action: ResultRetryAction, target: RetryTarget): RetryActionBriefing {
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
  if (action.label === "Repeat Line") {
    return {
      label: "Next run",
      value: "Lock the style route",
      tone: "opportunity"
    };
  }
  if (action.label === "Chase Comet") {
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
  if (fuelRatio >= cometReserveNearMissRatio && fuelRatio < cometReserveMinRatio) {
    return {
      label: "Retry target",
      value: "Bank 75% fuel for comet",
      tone: "opportunity"
    };
  }

  if (fuelRatio >= cometReserveMinRatio && (input.landingBonus ?? 0) < perfectLandingBonus) {
    return {
      label: "Retry target",
      value: "Perfect dock for comet",
      tone: "opportunity"
    };
  }

  return undefined;
}
