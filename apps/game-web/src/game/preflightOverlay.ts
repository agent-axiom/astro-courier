import type { RunStatus } from "@astro-courier/shared";

export type PreflightOverlayDensityInput = {
  status: RunStatus;
  preflightOpen: boolean;
  savedRouteCount: number;
  dailyStreak?: number;
};

export type PreflightOverlayDensity = {
  mode: "poster" | "focused" | "expanded";
  showContractTitle: boolean;
  showContractBriefing: boolean;
  showControlPrimer: boolean;
  showLaunchSummary: boolean;
  showCargoManifest: boolean;
  showRoutePlanBriefing: boolean;
  showProgressMeta: boolean;
  showBestChase: boolean;
  showRouteMarkTarget: boolean;
  showRouteBoardTarget: boolean;
  showRouteBoardStack: boolean;
  showDailyDispatch: boolean;
  showContractSelector: boolean;
  showContractDetails: boolean;
  showRouteEndpoints: boolean;
  showRoutePressure: boolean;
  showSignatureManeuver: boolean;
  showBonusStack: boolean;
};

export function buildPreflightOverlayDensity(input: PreflightOverlayDensityInput): PreflightOverlayDensity {
  const hasRouteHistory = input.savedRouteCount > 0;
  const hasDailyHistory = (input.dailyStreak ?? 0) > 0;
  const richHistory = input.savedRouteCount >= 4 || (input.dailyStreak ?? 0) >= 3;
  const activePreflight = input.preflightOpen && input.status === "paused";

  if (!activePreflight) {
    return {
      mode: "focused",
      showContractTitle: false,
      showContractBriefing: false,
      showControlPrimer: false,
      showLaunchSummary: false,
      showCargoManifest: false,
      showRoutePlanBriefing: false,
      showProgressMeta: false,
      showBestChase: false,
      showRouteMarkTarget: false,
      showRouteBoardTarget: false,
      showRouteBoardStack: false,
      showDailyDispatch: false,
      showContractSelector: false,
      showContractDetails: false,
      showRouteEndpoints: false,
      showRoutePressure: false,
      showSignatureManeuver: false,
      showBonusStack: false
    };
  }

  if (!hasRouteHistory && !hasDailyHistory) {
    return {
      mode: "poster",
      showContractTitle: false,
      showContractBriefing: false,
      showControlPrimer: false,
      showLaunchSummary: false,
      showCargoManifest: false,
      showRoutePlanBriefing: false,
      showProgressMeta: false,
      showBestChase: false,
      showRouteMarkTarget: false,
      showRouteBoardTarget: false,
      showRouteBoardStack: false,
      showDailyDispatch: false,
      showContractSelector: false,
      showContractDetails: false,
      showRouteEndpoints: false,
      showRoutePressure: false,
      showSignatureManeuver: false,
      showBonusStack: false
    };
  }

  if (!richHistory) {
    return {
      mode: "focused",
      showContractTitle: true,
      showContractBriefing: false,
      showControlPrimer: true,
      showLaunchSummary: false,
      showCargoManifest: false,
      showRoutePlanBriefing: false,
      showProgressMeta: true,
      showBestChase: false,
      showRouteMarkTarget: false,
      showRouteBoardTarget: hasRouteHistory,
      showRouteBoardStack: false,
      showDailyDispatch: hasDailyHistory,
      showContractSelector: false,
      showContractDetails: false,
      showRouteEndpoints: false,
      showRoutePressure: false,
      showSignatureManeuver: false,
      showBonusStack: false
    };
  }

  return {
    mode: "expanded",
    showContractTitle: true,
    showContractBriefing: false,
    showControlPrimer: false,
    showLaunchSummary: false,
    showCargoManifest: true,
    showRoutePlanBriefing: true,
    showProgressMeta: true,
    showBestChase: true,
    showRouteMarkTarget: true,
    showRouteBoardTarget: true,
    showRouteBoardStack: richHistory,
    showDailyDispatch: true,
    showContractSelector: true,
    showContractDetails: richHistory,
    showRouteEndpoints: true,
    showRoutePressure: true,
    showSignatureManeuver: true,
    showBonusStack: richHistory
  };
}
