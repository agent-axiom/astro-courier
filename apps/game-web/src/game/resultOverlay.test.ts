import { describe, expect, it } from "vitest";
import { buildResultOverlayDensity } from "./resultOverlay";

describe("result overlay density", () => {
  it("keeps crash results focused on a compact cause and retry instead of report stats", () => {
    expect(buildResultOverlayDensity({ status: "crashed" })).toEqual({
      showDetailedScore: false,
      showCrashDebrief: false,
      showRunGrade: false,
      showResultSummary: false,
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

  it("keeps delivered results light enough for fast retries", () => {
    expect(buildResultOverlayDensity({ status: "delivered", medal: "none", grade: "D" })).toEqual({
      showDetailedScore: false,
      showCrashDebrief: false,
      showRunGrade: false,
      showResultSummary: false,
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

  it("keeps strong delivered results compact instead of opening a report", () => {
    expect(buildResultOverlayDensity({ status: "delivered", medal: "gold", grade: "A" })).toEqual({
      showDetailedScore: false,
      showCrashDebrief: false,
      showRunGrade: false,
      showResultSummary: false,
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

  it("keeps comet results compact as an instant retry screen", () => {
    expect(buildResultOverlayDensity({ status: "delivered", medal: "comet", grade: "S" }).showDetailedScore).toBe(false);
    expect(buildResultOverlayDensity({ status: "delivered", medal: "comet", grade: "S" }).showRunReceipts).toBe(false);
  });
});
