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
  showResultSummary: boolean;
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
  return {
    showDetailedScore: false,
    showCrashDebrief: input.status === "crashed",
    showRunGrade: false,
    showResultSummary: false,
    showQuickStats: false,
    showRunReceipts: false,
    showCoach: false,
    showTempoRecap: false,
    showRetryTarget: false,
    showRetryActionBriefing: false,
    showRouteProgress: false,
    showBoardAction: false
  };
}
