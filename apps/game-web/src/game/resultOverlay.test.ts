import { describe, expect, it } from "vitest";
import { buildResultOverlayDensity } from "./resultOverlay";

describe("result overlay density", () => {
  it("keeps crash results focused while showing the next retry target", () => {
    expect(buildResultOverlayDensity({ status: "crashed" })).toEqual({
      showDetailedScore: false,
      showRunReceipts: false,
      showTempoRecap: false,
      showRetryTarget: true,
      showRouteProgress: false,
      showBoardAction: false
    });
  });

  it("keeps ordinary delivered results focused enough for fast retries", () => {
    expect(buildResultOverlayDensity({ status: "delivered", medal: "none", grade: "D" })).toEqual({
      showDetailedScore: false,
      showRunReceipts: false,
      showTempoRecap: false,
      showRetryTarget: true,
      showRouteProgress: false,
      showBoardAction: false
    });
  });

  it("keeps strong delivered results rich enough to celebrate progress", () => {
    expect(buildResultOverlayDensity({ status: "delivered", medal: "gold", grade: "A" })).toEqual({
      showDetailedScore: true,
      showRunReceipts: true,
      showTempoRecap: true,
      showRetryTarget: true,
      showRouteProgress: true,
      showBoardAction: true
    });
  });

  it("keeps comet results rich as the elite delivery celebration", () => {
    expect(buildResultOverlayDensity({ status: "delivered", medal: "comet", grade: "S" }).showDetailedScore).toBe(true);
  });
});
