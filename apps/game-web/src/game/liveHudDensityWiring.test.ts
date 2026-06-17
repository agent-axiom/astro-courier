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
    expect(appSource).toContain("angleError: hud.targetAngleError");
    expect(appSource).toContain("requiredAngleTolerance: hud.targetRequiredAngleTolerance");
    expect(appSource).toContain('className={`docking-lane docking-lane-${dockingLane.tone}`}');
    expect(appSource).toContain('style={dockingLaneStyle}');
  });

  it("renders a large final dock pulse over the playfield", () => {
    expect(appSource).toContain("const dockingPulse = buildDockingPulsePresentation({");
    expect(appSource).toContain("angleError: hud.targetAngleError");
    expect(appSource).toContain("requiredAngleTolerance: hud.targetRequiredAngleTolerance");
    expect(appSource).toContain("const dockingPulseStyle = {");
    expect(appSource).toContain('"--dock-pulse-progress": dockingPulse?.progress ?? 0');
    expect(appSource).toContain('className={`dock-pulse dock-pulse-${dockingPulse.tone}`}');
    expect(appSource).toContain('aria-label={`Docking cue: ${dockingPulse.action}. ${dockingPulse.detail}`}');
  });

  it("renders a large final pickup pulse over the playfield", () => {
    expect(appSource).toContain("const pickupPulse = buildPickupPulsePresentation({");
    expect(appSource).toContain("quickPickupSecondsRemaining: hud.quickPickupSecondsRemaining");
    expect(appSource).toContain("quickPickupBonus: hud.quickPickupBonus");
    expect(appSource).toContain("const pickupPulseStyle = {");
    expect(appSource).toContain('"--pickup-pulse-progress": pickupPulse?.progress ?? 0');
    expect(appSource).toContain('className={`pickup-pulse pickup-pulse-${pickupPulse.tone}`}');
    expect(appSource).toContain('aria-label={`Pickup cue: ${pickupPulse.action}. ${pickupPulse.detail}`}');
  });

  it("renders a visual target compass over the playfield", () => {
    expect(appSource).toContain("const targetCompass = buildTargetCompassPresentation({");
    expect(appSource).toContain("relativeBearing: hud.targetRelativeBearing");
    expect(appSource).toContain("const targetCompassStyle = {");
    expect(appSource).toContain('"--target-compass-angle": `${targetCompass?.angleDeg ?? 0}deg`');
    expect(appSource).toContain('"--target-compass-progress": targetCompass?.progress ?? 0');
    expect(appSource).toContain('"--target-compass-progress-turn": `${targetCompass?.progress ?? 0}turn`');
    expect(appSource).toContain('"--target-compass-ring-opacity": targetCompass ? 0.18 + targetCompass.progress * 0.42 : 0.18');
    expect(appSource).toContain('className={`target-compass target-compass-${targetCompass.tone}`}');
    expect(appSource).toContain('aria-label={`Target compass: ${targetCompass.label}. ${targetCompass.distance}`}');
  });
});
