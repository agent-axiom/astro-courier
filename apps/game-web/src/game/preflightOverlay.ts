import type { RunStatus } from "@astro-courier/shared";

export type PreflightOverlayDensityInput = {
  status: RunStatus;
  preflightOpen: boolean;
  savedRouteCount: number;
  dailyStreak?: number;
};

export type PreflightOverlayDensity = {
  mode: "focused" | "expanded";
  showControlPrimer: boolean;
  showProgressMeta: boolean;
  showRouteBoardStack: boolean;
  showDailyDispatch: boolean;
  showContractSelector: boolean;
  showContractDetails: boolean;
  showBonusStack: boolean;
};

export function buildPreflightOverlayDensity(input: PreflightOverlayDensityInput): PreflightOverlayDensity {
  const hasRouteHistory = input.savedRouteCount > 0;
  const hasDailyHistory = (input.dailyStreak ?? 0) > 0;
  const richHistory = input.savedRouteCount >= 4 || (input.dailyStreak ?? 0) >= 3;
  const expanded = input.preflightOpen && input.status === "paused" && (hasRouteHistory || hasDailyHistory);

  if (!expanded) {
    return {
      mode: "focused",
      showControlPrimer: input.preflightOpen && input.status === "paused",
      showProgressMeta: false,
      showRouteBoardStack: false,
      showDailyDispatch: false,
      showContractSelector: false,
      showContractDetails: false,
      showBonusStack: false
    };
  }

  return {
    mode: "expanded",
    showControlPrimer: false,
    showProgressMeta: true,
    showRouteBoardStack: richHistory,
    showDailyDispatch: true,
    showContractSelector: true,
    showContractDetails: richHistory,
    showBonusStack: richHistory
  };
}
