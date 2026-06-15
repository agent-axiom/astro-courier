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
});
