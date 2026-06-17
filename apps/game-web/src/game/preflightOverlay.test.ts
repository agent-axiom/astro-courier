import { describe, expect, it } from "vitest";
import { buildPreflightOverlayDensity } from "./preflightOverlay";

describe("preflight overlay density", () => {
  it("keeps a fresh first launch focused for fast play", () => {
    expect(
      buildPreflightOverlayDensity({
        status: "paused",
        preflightOpen: true,
        savedRouteCount: 0
      })
    ).toEqual({
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
    });
  });

  it("keeps early route history lightweight without campaign calls to action", () => {
    expect(
      buildPreflightOverlayDensity({
        status: "paused",
        preflightOpen: true,
        savedRouteCount: 1
      })
    ).toEqual({
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
      showRouteBoardTarget: false,
      showRouteBoardStack: false,
      showDailyDispatch: false,
      showContractSelector: false,
      showContractDetails: false,
      showRouteEndpoints: false,
      showRoutePressure: false,
      showSignatureManeuver: false,
      showBonusStack: false
    });
  });

  it("opens richer board details only after the player has real route history", () => {
    expect(
      buildPreflightOverlayDensity({
        status: "paused",
        preflightOpen: true,
        savedRouteCount: 4
      })
    ).toEqual({
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
      showRouteBoardStack: true,
      showDailyDispatch: true,
      showContractSelector: true,
      showContractDetails: true,
      showRouteEndpoints: true,
      showRoutePressure: true,
      showSignatureManeuver: true,
      showBonusStack: true
    });
  });

  it("keeps daily streak context visible after a daily clear", () => {
    const density = buildPreflightOverlayDensity({
      status: "paused",
      preflightOpen: true,
      savedRouteCount: 0,
      dailyStreak: 2
    });

    expect(density.showDailyDispatch).toBe(true);
    expect(density.showContractTitle).toBe(true);
    expect(density.showLaunchSummary).toBe(false);
    expect(density.showControlPrimer).toBe(true);
    expect(density.showCargoManifest).toBe(false);
    expect(density.showRoutePlanBriefing).toBe(false);
  });
});
