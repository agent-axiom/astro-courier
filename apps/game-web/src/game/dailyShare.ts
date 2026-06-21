import type { RunMedal, RunStatus } from "@astro-courier/shared";

export type DailyShareDispatch = {
  contractId: string;
  seed: string;
  label: string;
};

export type DailyShareInput = {
  dispatch: DailyShareDispatch | undefined;
  contractId: string;
  contractTitle: string;
  status: Extract<RunStatus, "crashed" | "delivered">;
  medal: RunMedal;
  score: number;
  elapsedSeconds: number;
  isNewBest: boolean;
  url: string;
};

export type DailyShare = {
  label: "Daily share";
  value: string;
  detail: string;
  tone: "failed" | "clear" | "gold" | "comet" | "new-best";
  text: string;
};

export function buildDailyShare(input: DailyShareInput): DailyShare | undefined {
  if (!input.dispatch || input.dispatch.contractId !== input.contractId) {
    return undefined;
  }

  const score = Math.round(input.score);
  const scoreLabel = score.toLocaleString("en-US");
  const timeLabel = `${input.elapsedSeconds.toFixed(1)}s`;
  if (input.status === "crashed") {
    return {
      label: "Daily share",
      value: `Failed ${scoreLabel}`,
      detail: timeLabel,
      tone: "failed",
      text: [`Astro Courier daily: ${input.contractTitle}`, `Failed - ${timeLabel} - ${scoreLabel} pts`, input.url].join("\n")
    };
  }

  const medal = medalLabel(input.medal);
  const tone = input.medal === "comet" ? "comet" : input.medal === "gold" ? "gold" : input.isNewBest ? "new-best" : "clear";
  const pbSuffix = input.isNewBest ? " / PB" : "";
  return {
    label: "Daily share",
    value: `${medal} ${scoreLabel}`,
    detail: `${timeLabel}${pbSuffix}`,
    tone,
    text: [`Astro Courier daily: ${input.contractTitle}`, `${medal} - ${timeLabel} - ${scoreLabel} pts${input.isNewBest ? " - PB" : ""}`, input.url].join("\n")
  };
}

function medalLabel(medal: RunMedal): string {
  if (medal === "comet") return "Comet";
  if (medal === "gold") return "Gold";
  if (medal === "silver") return "Silver";
  if (medal === "bronze") return "Bronze";
  return "Clear";
}
