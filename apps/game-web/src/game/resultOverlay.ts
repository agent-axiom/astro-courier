import type { RunStatus } from "@astro-courier/shared";

export type ResultOverlayDensityInput = {
  status: Extract<RunStatus, "delivered" | "crashed">;
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
  const richResult = input.status === "delivered";

  return {
    showDetailedScore: richResult,
    showRunReceipts: richResult,
    showTempoRecap: richResult,
    showRetryTarget: true,
    showRouteProgress: richResult,
    showBoardAction: richResult
  };
}
