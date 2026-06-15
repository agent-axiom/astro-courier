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
      showControlPrimer: true,
      showProgressMeta: false,
      showRouteBoardStack: false,
      showDailyDispatch: false,
      showContractSelector: false,
      showContractDetails: false,
      showBonusStack: false
    });
  });

  it("keeps early route history lightweight with one progression target", () => {
    expect(
      buildPreflightOverlayDensity({
        status: "paused",
        preflightOpen: true,
        savedRouteCount: 1
      })
    ).toEqual({
      mode: "expanded",
      showControlPrimer: false,
      showProgressMeta: true,
      showRouteBoardStack: false,
      showDailyDispatch: true,
      showContractSelector: true,
      showContractDetails: false,
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
      showControlPrimer: false,
      showProgressMeta: true,
      showRouteBoardStack: true,
      showDailyDispatch: true,
      showContractSelector: true,
      showContractDetails: true,
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
