import type { RunStatus } from "@astro-courier/shared";

export type PreflightOverlayDensityInput = {
  status: RunStatus;
  preflightOpen: boolean;
  savedRouteCount: number;
  dailyStreak?: number;
};

export type PreflightOverlayDensity = {
  mode: "focused" | "expanded";
  showContractBriefing: boolean;
  showControlPrimer: boolean;
  showProgressMeta: boolean;
  showRouteBoardStack: boolean;
  showDailyDispatch: boolean;
  showContractSelector: boolean;
  showContractDetails: boolean;
  showRoutePressure: boolean;
  showSignatureManeuver: boolean;
  showBonusStack: boolean;
};

export function buildPreflightOverlayDensity(input: PreflightOverlayDensityInput): PreflightOverlayDensity {
  const hasRouteHistory = input.savedRouteCount > 0;
  const hasDailyHistory = (input.dailyStreak ?? 0) > 0;
  const richHistory = input.savedRouteCount >= 4 || (input.dailyStreak ?? 0) >= 3;
  const activePreflight = input.preflightOpen && input.status === "paused";

  if (!activePreflight || (!hasRouteHistory && !hasDailyHistory)) {
    return {
      mode: "focused",
      showContractBriefing: activePreflight,
      showControlPrimer: activePreflight,
      showProgressMeta: false,
      showRouteBoardStack: false,
      showDailyDispatch: false,
      showContractSelector: false,
      showContractDetails: false,
      showRoutePressure: false,
      showSignatureManeuver: false,
      showBonusStack: false
    };
  }

  if (!richHistory) {
    return {
      mode: "focused",
      showContractBriefing: false,
      showControlPrimer: false,
      showProgressMeta: true,
      showRouteBoardStack: false,
      showDailyDispatch: hasDailyHistory,
      showContractSelector: false,
      showContractDetails: false,
      showRoutePressure: false,
      showSignatureManeuver: false,
      showBonusStack: false
    };
  }

  return {
    mode: "expanded",
    showContractBriefing: false,
    showControlPrimer: false,
    showProgressMeta: true,
    showRouteBoardStack: richHistory,
    showDailyDispatch: true,
    showContractSelector: true,
    showContractDetails: richHistory,
    showRoutePressure: true,
    showSignatureManeuver: true,
    showBonusStack: richHistory
  };
}
