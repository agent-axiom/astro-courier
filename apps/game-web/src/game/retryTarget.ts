import type { CrashReason, RunMedal, RunStatus } from "@astro-courier/shared";
import type { BestRun } from "./bestRun";

export type RetryTargetInput = {
  status: RunStatus;
  contractId?: string;
  crashReason?: CrashReason;
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
        value: input.contractId === "gravity-slingshot" ? "Hold outer sling lane" : "Clear gravity well",
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

  if (input.medal !== "gold" && input.medal !== "comet") {
    return {
      label: "Retry target",
      value: `Gold under ${input.goldSeconds.toFixed(1)}s`,
      tone: "opportunity"
    };
  }

  return {
    label: "Retry target",
    value: input.bestRun ? "Add one more bonus" : "Set first PB",
    tone: "opportunity"
  };
}
