import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("preflight overlay density wiring", () => {
  it("derives focused preflight density before rendering the launch briefing", () => {
    expect(appSource).toContain('from "./game/preflightOverlay"');
    expect(appSource).toContain("const preflightOverlayDensity = buildPreflightOverlayDensity({");
    expect(appSource).toContain("savedRouteCount:");
    expect(appSource).toContain("dailyStreak: dailyProgress?.streak");
  });

  it("gates heavy preflight sections behind density flags", () => {
    expect(appSource).toContain("preflight-overlay-${preflightOverlayDensity.mode}");
    expect(appSource).toContain("preflightOverlayDensity.showContractBriefing ? <p>{hud.contractBriefing}</p> : null");
    expect(appSource).toContain("preflightOverlayDensity.showControlPrimer");
    expect(appSource).toContain("preflightOverlayDensity.showContractTitle ? <h2>{hud.contractTitle}</h2> : null");
    expect(appSource).toContain("preflightOverlayDensity.showLaunchSummary");
    expect(appSource).toContain('className="preflight-launch-summary"');
    expect(appSource).toContain("preflightOverlayDensity.showCargoManifest");
    expect(appSource).toContain("preflightOverlayDensity.showRoutePlanBriefing");
    expect(appSource).toContain("preflightOverlayDensity.showBestChase");
    expect(appSource).toContain("preflightOverlayDensity.showRouteMarkTarget");
    expect(appSource).toContain("preflightOverlayDensity.showRouteBoardTarget && hud.contractOptions.length > 0");
    expect(appSource).toContain("preflightOverlayDensity.showRouteBoardStack && hud.contractOptions.length > 0");
    expect(appSource).toContain("preflightOverlayDensity.showDailyDispatch && dailyDispatch");
    expect(appSource).toContain("preflightOverlayDensity.showContractSelector && hud.contractOptions.length > 1");
    expect(appSource).toContain("preflightOverlayDensity.showRoutePressure");
    expect(appSource).toContain("preflightOverlayDensity.showSignatureManeuver");
    expect(appSource).toContain("preflightOverlayDensity.showRouteEndpoints");
    expect(appSource).toContain("preflightOverlayDensity.showBonusStack");
    expect(appSource).toContain("preflightOverlayDensity.showContractDetails");
    expect(appSource).toContain("preflightOverlayDensity.showRouteMarkTarget ? <small>{routeMarkLaunchCaption.value}</small> : null");
    expect(appSource).toContain("<span>Launch</span>");
  });

  it("renders preflight mini goals from mission puzzle goals", () => {
    expect(appSource).toContain("const preflightPuzzleGoals = buildPreflightPuzzleGoals({");
    expect(appSource).toContain("preflightPuzzleGoals.map((goal) =>");
    expect(appSource).toContain("renderPreflightPuzzleGoalIcon(goal)");
  });

  it("renders compact ship upgrade progression in preflight", () => {
    expect(appSource).toContain("const shipUpgradeTrack = buildShipUpgradeTrack(hud.contractOptions, bestRunsByContract)");
    expect(appSource).toContain("const shipUpgradeSummary = buildShipUpgradeSummary(shipUpgradeTrack)");
    expect(appSource).toContain('className={`ship-upgrade-track ship-upgrade-track-${shipUpgradeSummary.tone}`}');
    expect(appSource).toContain("shipUpgradeTrack.map((upgrade) =>");
    expect(appSource).toContain("renderShipUpgradeIcon(upgrade)");
  });

  it("wires the first-run courier license cue without opening a tutorial panel", () => {
    expect(appSource).toContain('from "./game/courierLicense"');
    expect(appSource).toContain("const courierLicenseCue = buildCourierLicenseCue({");
    expect(appSource).toContain("shouldIssueCourierLicense({");
    expect(appSource).toContain("courier-license-cue");
  });
});
