import type { RunGrade, RunMedal, RunStatus } from "@astro-courier/shared";

export type ResultOverlayDensityInput = {
  status: Extract<RunStatus, "delivered" | "crashed">;
  medal?: RunMedal;
  grade?: RunGrade;
};

export type ResultOverlayDensity = {
  showDetailedScore: boolean;
  showRunReceipts: boolean;
  showTempoRecap: boolean;
  showRetryTarget: boolean;
  showRouteProgress: boolean;
  showBoardAction: boolean;
};

export function buildResultOverlayDensity(input: ResultOverlayDensityInput): ResultOverlayDensity {
  const richResult =
    input.status === "delivered" &&
    (input.medal === "gold" || input.medal === "comet" || input.grade === "A" || input.grade === "S");

  return {
    showDetailedScore: richResult,
    showRunReceipts: richResult,
    showTempoRecap: richResult,
    showRetryTarget: true,
    showRouteProgress: richResult,
    showBoardAction: richResult
  };
}
