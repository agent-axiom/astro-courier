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
  label: "Retry Route" | "Defend PB" | "Chase PB" | "Repeat Line" | "Run Again";
};

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

  const milestoneTarget = buildRepeatableMilestoneTarget(input.lastMilestone);
  if (milestoneTarget) {
    return milestoneTarget;
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
    case "Damage Control":
    case "Last Drop":
    case "No Brake Finesse":
    case "Perfect Approach":
    case "Chain Finish":
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
    return { label: "Retry Route" };
  }
  if (target.tone === "success") {
    return { label: "Defend PB" };
  }
  if (target.tone === "chase") {
    return { label: "Chase PB" };
  }
  if (target.value.startsWith("Repeat ")) {
    return { label: "Repeat Line" };
  }
  return { label: "Run Again" };
}
