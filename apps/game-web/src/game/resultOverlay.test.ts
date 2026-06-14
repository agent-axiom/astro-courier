import { describe, expect, it } from "vitest";
import { buildResultOverlayDensity } from "./resultOverlay";

describe("result overlay density", () => {
  it("keeps crash results focused on one readable lesson", () => {
    expect(buildResultOverlayDensity({ status: "crashed" })).toEqual({
      showDetailedScore: false,
      showRunReceipts: false,
      showTempoRecap: false,
      showRetryTarget: false,
      showRouteProgress: false,
      showBoardAction: false
    });
  });

  it("keeps delivered results rich enough to celebrate progress", () => {
    expect(buildResultOverlayDensity({ status: "delivered" })).toEqual({
      showDetailedScore: true,
      showRunReceipts: true,
      showTempoRecap: true,
      showRetryTarget: true,
      showRouteProgress: true,
      showBoardAction: true
    });
  });
});
