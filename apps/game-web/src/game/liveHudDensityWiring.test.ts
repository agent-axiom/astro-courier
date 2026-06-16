import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

describe("live HUD density wiring", () => {
  it("wires focused and expanded live HUD modes into the run panel", () => {
    expect(appSource).toContain('import { buildLiveHudDensity } from "./game/liveHudDensity";');
    expect(appSource).toContain("const liveHudDensity = buildLiveHudDensity({");
    expect(appSource).toContain("liveHudDensity.visible ? (");
    expect(appSource).toContain('run-panel-${liveHudDensity.expanded ? "expanded" : "focused"}');
  });

  it("keeps action and telemetry chips behind live density gates", () => {
    expect(appSource).toMatch(/liveHudDensity\.showRadioMessage \? \(\s*<div className="radio-message">/);
    expect(appSource).toMatch(/liveHudDensity\.showRouteTempo && routeTempo \?/);
    expect(appSource).toMatch(/liveHudDensity\.showRunFeed && runFeed\.length > 0 && !preflightOpen \?/);
    expect(appSource).toMatch(/liveHudDensity\.showPrimaryStatusRows \? \(\s*<div className="status-row">\s*<span>Status<\/span>/);
    expect(appSource).toMatch(/liveHudDensity\.showPrimaryStatusRows \? \(\s*<div className="status-row">\s*<span>Target<\/span>/);
    expect(appSource).toMatch(/liveHudDensity\.showActionChips && tacticalCue \?/);
    expect(appSource).toMatch(/liveHudDensity\.showActionChips && objectiveInterceptReadout \?/);
    expect(appSource).toMatch(/liveHudDensity\.showDockingLane && dockingLane \?/);
    expect(appSource).toMatch(/liveHudDensity\.showTelemetryChips && dockingSpeedReadout \?/);
    expect(appSource).toMatch(/liveHudDensity\.showPrimaryStatusRows \? \(\s*<div className="status-row">\s*<span>Time<\/span>/);
    expect(appSource).toMatch(/liveHudDensity\.showPrimaryStatusRows \? \(\s*<div className="status-row">\s*<span>Score<\/span>/);
  });

  it("keeps the focused flight director visually reduced to action copy", () => {
    expect(appSource).toMatch(/liveHudDensity\.expanded \? <span>{flightDirector\.label}<\/span> : null/);
    expect(appSource).toContain('aria-label={`${flightDirector.label}: ${flightDirector.action}. ${flightDirector.detail}`}');
  });

  it("builds the compact docking lane from live landing state", () => {
    expect(appSource).toContain("const dockingLane = buildDockingLanePresentation({");
    expect(appSource).toContain("landingStatus: hud.landingStatus");
    expect(appSource).toContain('className={`docking-lane docking-lane-${dockingLane.tone}`}');
    expect(appSource).toContain('style={dockingLaneStyle}');
  });

  it("renders a large final dock pulse over the playfield", () => {
    expect(appSource).toContain("const dockingPulse = buildDockingPulsePresentation({");
    expect(appSource).toContain("const dockingPulseStyle = {");
    expect(appSource).toContain('"--dock-pulse-progress": dockingPulse?.progress ?? 0');
    expect(appSource).toContain('className={`dock-pulse dock-pulse-${dockingPulse.tone}`}');
    expect(appSource).toContain('aria-label={`Docking cue: ${dockingPulse.action}. ${dockingPulse.detail}`}');
  });
});
