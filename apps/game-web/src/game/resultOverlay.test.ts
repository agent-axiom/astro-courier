import { describe, expect, it } from "vitest";
import { buildResultOverlayDensity } from "./resultOverlay";

describe("result overlay density", () => {
  it("keeps crash results focused on retry instead of report stats", () => {
    expect(buildResultOverlayDensity({ status: "crashed" })).toEqual({
      showDetailedScore: false,
      showCrashDebrief: false,
      showRunGrade: false,
      showQuickStats: false,
      showRunReceipts: false,
      showCoach: false,
      showTempoRecap: false,
      showRetryTarget: false,
      showRetryActionBriefing: false,
      showRouteProgress: false,
      showBoardAction: false
    });
  });

  it("keeps ordinary delivered results focused enough for fast retries", () => {
    expect(buildResultOverlayDensity({ status: "delivered", medal: "none", grade: "D" })).toEqual({
      showDetailedScore: false,
      showCrashDebrief: false,
      showRunGrade: true,
      showQuickStats: true,
      showRunReceipts: false,
      showCoach: true,
      showTempoRecap: false,
      showRetryTarget: true,
      showRetryActionBriefing: true,
      showRouteProgress: false,
      showBoardAction: false
    });
  });

  it("keeps strong delivered results rich enough to celebrate progress", () => {
    expect(buildResultOverlayDensity({ status: "delivered", medal: "gold", grade: "A" })).toEqual({
      showDetailedScore: true,
      showCrashDebrief: false,
      showRunGrade: true,
      showQuickStats: true,
      showRunReceipts: true,
      showCoach: true,
      showTempoRecap: true,
      showRetryTarget: true,
      showRetryActionBriefing: true,
      showRouteProgress: true,
      showBoardAction: true
    });
  });

  it("keeps comet results rich as the elite delivery celebration", () => {
    expect(buildResultOverlayDensity({ status: "delivered", medal: "comet", grade: "S" }).showDetailedScore).toBe(true);
  });
});
