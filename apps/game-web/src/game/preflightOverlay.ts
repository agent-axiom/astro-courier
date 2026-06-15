import type { RunStatus } from "@astro-courier/shared";

export type PreflightOverlayDensityInput = {
  status: RunStatus;
  preflightOpen: boolean;
  savedRouteCount: number;
  dailyStreak?: number;
};

export type PreflightOverlayDensity = {
  mode: "focused" | "expanded";
  showProgressMeta: boolean;
  showDailyDispatch: boolean;
  showContractDetails: boolean;
  showBonusStack: boolean;
};

export function buildPreflightOverlayDensity(input: PreflightOverlayDensityInput): PreflightOverlayDensity {
  const hasRouteHistory = input.savedRouteCount > 0;
  const hasDailyHistory = (input.dailyStreak ?? 0) > 0;
  const expanded = input.preflightOpen && input.status === "paused" && (hasRouteHistory || hasDailyHistory);

  if (!expanded) {
    return {
      mode: "focused",
      showProgressMeta: false,
      showDailyDispatch: false,
      showContractDetails: false,
      showBonusStack: false
    };
  }

  return {
    mode: "expanded",
    showProgressMeta: true,
    showDailyDispatch: true,
    showContractDetails: true,
    showBonusStack: true
  };
}
