import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("result overlay density wiring", () => {
  it("keeps personal-best receipts behind run receipt density", () => {
    expect(appSource).toMatch(/hud\.status === "delivered" && resultOverlayDensity\?\.showRunReceipts && bestRun \?/);
    expect(appSource).toMatch(/hud\.status === "delivered" && resultOverlayDensity\?\.showRunReceipts && bestRunDelta \?/);
  });

  it("keeps route progress receipts behind route progress density", () => {
    expect(appSource).toMatch(/hud\.status === "delivered" && resultOverlayDensity\?\.showRouteProgress && routeMarkReceipt \?/);
    expect(appSource).toMatch(/hud\.status === "delivered" && resultOverlayDensity\?\.showRouteProgress && campaignMilestoneReceipt \?/);
  });

  it("keeps focused crash results from rendering dense report widgets", () => {
    expect(appSource).toContain("resultOverlayDensity?.showCrashDebrief && crashDebrief");
    expect(appSource).toContain("resultOverlayDensity?.showRunGrade");
    expect(appSource).toContain("resultOverlayDensity?.showResultSummary");
    expect(appSource).toContain('className="result-summary-strip"');
    expect(appSource).toContain("resultOverlayDensity?.showQuickStats");
    expect(appSource).toContain("resultOverlayDensity?.showCoach");
    expect(appSource).toContain("resultOverlayDensity?.showRetryActionBriefing");
  });

  it("keeps medal celebration copy behind compact result density", () => {
    expect(appSource).toContain('resultOverlayDensity?.showQuickStats && hud.medal !== "none"');
  });
});
