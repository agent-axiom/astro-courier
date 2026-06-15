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
      mode: "focused",
      showContractBriefing: true,
      showControlPrimer: true,
      showProgressMeta: false,
      showBestChase: false,
      showRouteMarkTarget: false,
      showRouteBoardTarget: false,
      showRouteBoardStack: false,
      showDailyDispatch: false,
      showContractSelector: false,
      showContractDetails: false,
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
      showContractBriefing: false,
      showControlPrimer: false,
      showProgressMeta: true,
      showBestChase: false,
      showRouteMarkTarget: false,
      showRouteBoardTarget: false,
      showRouteBoardStack: false,
      showDailyDispatch: false,
      showContractSelector: false,
      showContractDetails: false,
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
      showContractBriefing: false,
      showControlPrimer: false,
      showProgressMeta: true,
      showBestChase: true,
      showRouteMarkTarget: true,
      showRouteBoardTarget: true,
      showRouteBoardStack: true,
      showDailyDispatch: true,
      showContractSelector: true,
      showContractDetails: true,
      showRoutePressure: true,
      showSignatureManeuver: true,
      showBonusStack: true
    });
  });

  it("keeps daily streak context visible after a daily clear", () => {
    expect(
      buildPreflightOverlayDensity({
        status: "paused",
        preflightOpen: true,
        savedRouteCount: 0,
        dailyStreak: 2
      }).showDailyDispatch
    ).toBe(true);
  });
});
