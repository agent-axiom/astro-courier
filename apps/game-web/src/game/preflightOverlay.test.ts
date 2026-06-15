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
      showProgressMeta: false,
      showDailyDispatch: false,
      showContractDetails: false,
      showBonusStack: false
    });
  });

  it("opens progression details once the player has route history", () => {
    expect(
      buildPreflightOverlayDensity({
        status: "paused",
        preflightOpen: true,
        savedRouteCount: 1
      })
    ).toEqual({
      mode: "expanded",
      showProgressMeta: true,
      showDailyDispatch: true,
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
