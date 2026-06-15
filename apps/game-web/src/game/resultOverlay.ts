import type { RunGrade, RunMedal, RunStatus } from "@astro-courier/shared";

export type ResultOverlayDensityInput = {
  status: Extract<RunStatus, "delivered" | "crashed">;
  medal?: RunMedal;
  grade?: RunGrade;
};

export type ResultOverlayDensity = {
  showDetailedScore: boolean;
  showCrashDebrief: boolean;
  showRunGrade: boolean;
  showQuickStats: boolean;
  showRunReceipts: boolean;
  showCoach: boolean;
  showTempoRecap: boolean;
  showRetryTarget: boolean;
  showRetryActionBriefing: boolean;
  showRouteProgress: boolean;
  showBoardAction: boolean;
};

export function buildResultOverlayDensity(input: ResultOverlayDensityInput): ResultOverlayDensity {
  const richResult =
    input.status === "delivered" &&
    (input.medal === "gold" || input.medal === "comet" || input.grade === "A" || input.grade === "S");

  return {
    showDetailedScore: richResult,
    showCrashDebrief: false,
    showRunGrade: input.status === "delivered",
    showQuickStats: input.status === "delivered",
    showRunReceipts: richResult,
    showCoach: input.status === "delivered",
    showTempoRecap: richResult,
    showRetryTarget: input.status === "delivered",
    showRetryActionBriefing: input.status === "delivered",
    showRouteProgress: richResult,
    showBoardAction: richResult
  };
}
